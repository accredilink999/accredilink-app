import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { notifyModAction, forumInviteHtml } from '@/lib/forumEmail'


export const dynamic = 'force-dynamic'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://x.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'x')
function json(data, status = 200) { return NextResponse.json(data, { status }) }

// GET: admin dashboard stats
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
    if (!['founder', 'admin', 'moderator'].includes(fp?.forum_role)) {
      return json({ error: 'Not authorized' }, 403)
    }

    // Get stats
    const [
      { count: userCount },
      { count: threadCount },
      { count: replyCount },
      { data: bannedUsers },
      { data: recentUsers },
      { data: categories },
      { data: onlineUsers },
    ] = await Promise.all([
      supabase.from('forum_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('forum_threads').select('*', { count: 'exact', head: true }),
      supabase.from('forum_replies').select('*', { count: 'exact', head: true }),
      supabase.from('forum_profiles').select('id, username, display_name, forum_role, is_banned, ban_reason, created_at').eq('is_banned', true),
      supabase.from('forum_profiles').select('id, username, display_name, forum_role, is_banned, post_count, thread_count, created_at, last_seen_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('forum_categories').select('*').order('sort_order'),
      supabase.from('forum_profiles').select('id, username, display_name, forum_role, last_seen_at').gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    ])

    // Get permissions settings
    const { data: permSettings } = await supabase.from('forum_settings').select('value').eq('key', 'role_permissions').single()
    const permissions = permSettings?.value || null

    // Get all users for roles tab
    const { data: allUsers } = await supabase
      .from('forum_profiles')
      .select('id, username, display_name, avatar_url, forum_role, is_banned, post_count, thread_count, reputation, created_at, last_seen_at')
      .order('forum_role', { ascending: true })
      .order('created_at', { ascending: false })

    // Get invited emails tracking
    const { data: invitedRow } = await supabase.from('forum_settings').select('value').eq('key', 'forum_invited_emails').single()
    const invitedEmails = invitedRow?.value || []

    // Get all org admins/owners across orgs (for invite tab)
    let allOrgAdmins = []
    if (fp?.forum_role === 'founder') {
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('user_id, role, organization_id')
        .in('role', ['owner', 'admin'])

      if (orgMembers?.length) {
        const userIds = orgMembers.map(m => m.user_id)
        // Get profiles for these users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .in('id', userIds)

        // Get forum profiles to check who has joined
        const { data: forumProfiles } = await supabase
          .from('forum_profiles')
          .select('id, username')
          .in('id', userIds)

        const profileMap = {}
        ;(profiles || []).forEach(p => { profileMap[p.id] = p })
        const forumMap = {}
        ;(forumProfiles || []).forEach(f => { forumMap[f.id] = f })

        // Get org names
        const orgIds = [...new Set(orgMembers.map(m => m.organization_id))]
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds)
        const orgMap = {}
        ;(orgs || []).forEach(o => { orgMap[o.id] = o.name })

        allOrgAdmins = orgMembers.map(m => ({
          user_id: m.user_id,
          org_role: m.role,
          org_name: orgMap[m.organization_id] || 'Unknown',
          email: profileMap[m.user_id]?.email || '',
          full_name: profileMap[m.user_id]?.full_name || '',
          has_forum_profile: !!forumMap[m.user_id],
          forum_username: forumMap[m.user_id]?.username || null,
          was_invited: invitedEmails.includes(profileMap[m.user_id]?.email),
        }))
      }
    }

    return json({
      stats: { users: userCount || 0, threads: threadCount || 0, replies: replyCount || 0, online: onlineUsers?.length || 0 },
      onlineUsers: onlineUsers || [],
      bannedUsers: bannedUsers || [],
      recentUsers: recentUsers || [],
      categories: categories || [],
      allOrgAdmins,
      allUsers: allUsers || [],
      permissions,
      invitedEmails,
    })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// POST: admin actions
export async function POST(req) {
  try {
    const body = await req.json()
    const { token, action, userId, reason, categoryId, categoryData, role } = body
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
    const isMod = ['founder', 'admin', 'moderator'].includes(fp?.forum_role)
    const isAdmin = ['founder', 'admin'].includes(fp?.forum_role)
    const isFounder = fp?.forum_role === 'founder'

    if (!isMod) return json({ error: 'Not authorized' }, 403)

    switch (action) {
      case 'ban': {
        if (!userId) return json({ error: 'userId required' }, 400)
        // Can't ban higher roles
        const { data: target } = await supabase.from('forum_profiles').select('forum_role').eq('id', userId).single()
        if (target?.forum_role === 'founder') return json({ error: 'Cannot ban the founder' }, 403)
        if (target?.forum_role === 'admin' && !isFounder) return json({ error: 'Only founder can ban admins' }, 403)
        await supabase.from('forum_profiles').update({ is_banned: true, ban_reason: reason || 'Banned by moderator' }).eq('id', userId)
        notifyModAction(supabase, { userId, action: 'ban', reason: reason || 'Banned by moderator' }).catch(() => {})
        return json({ success: true })
      }

      case 'unban': {
        if (!userId) return json({ error: 'userId required' }, 400)
        await supabase.from('forum_profiles').update({ is_banned: false, ban_reason: null }).eq('id', userId)
        notifyModAction(supabase, { userId, action: 'unban' }).catch(() => {})
        return json({ success: true })
      }

      case 'warn': {
        if (!isMod) return json({ error: 'Not authorized' }, 403)
        if (!userId) return json({ error: 'userId required' }, 400)
        const { message } = body
        const warnMsg = message || 'You have received an official warning from the forum moderators. Please review our community guidelines.'
        // Send warning as a notification
        await supabase.from('forum_notifications').insert({
          user_id: userId,
          type: 'mod_action',
          actor_id: user.id,
          message: `⚠️ Warning: ${warnMsg}`,
          is_read: false,
        })
        return json({ success: true })
      }

      case 'set-role': {
        if (!isAdmin) return json({ error: 'Only admins can set roles' }, 403)
        if (!userId || !role) return json({ error: 'userId and role required' }, 400)
        if (role === 'founder') return json({ error: 'Cannot assign founder role' }, 403)
        if (role === 'admin' && !isFounder) return json({ error: 'Only founder can assign admin' }, 403)
        await supabase.from('forum_profiles').update({ forum_role: role }).eq('id', userId)
        return json({ success: true })
      }

      case 'update-category': {
        const { data: permRow2 } = await supabase.from('forum_settings').select('value').eq('key', 'role_permissions').single()
        const perms2 = permRow2?.value || {}
        const canManage = isFounder || isAdmin || !!(perms2[fp?.forum_role]?.manage_categories)
        if (!canManage) return json({ error: 'Not authorized to manage categories' }, 403)
        if (!categoryId || !categoryData) return json({ error: 'Missing fields' }, 400)
        await supabase.from('forum_categories').update(categoryData).eq('id', categoryId)
        return json({ success: true })
      }

      case 'create-category': {
        // Check stored permissions — founder/admin always can, mods need create_categories permission
        const { data: permRow } = await supabase.from('forum_settings').select('value').eq('key', 'role_permissions').single()
        const perms = permRow?.value || {}
        const canCreate = isFounder || isAdmin || (perms[fp?.forum_role]?.create_categories === true)
        if (!canCreate) return json({ error: 'You do not have permission to create categories' }, 403)
        if (!categoryData?.name || !categoryData?.slug) return json({ error: 'Name and slug required' }, 400)
        const { error: insertErr } = await supabase.from('forum_categories').insert(categoryData)
        if (insertErr) return json({ error: insertErr.message }, 500)
        return json({ success: true })
      }

      case 'delete-category': {
        if (!isFounder) return json({ error: 'Only founder can delete categories' }, 403)
        if (!categoryId) return json({ error: 'categoryId required' }, 400)
        await supabase.from('forum_categories').delete().eq('id', categoryId)
        return json({ success: true })
      }

      case 'send-direct-invite': {
        if (!isFounder) return json({ error: 'Only founder can send invites' }, 403)
        const { email: directEmail, name: directName } = body
        if (!directEmail) return json({ error: 'Email required' }, 400)

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ to: directEmail, subject: 'Join the CareCallAI Community Forum — Your Account is Ready', html: forumInviteHtml(directName) }),
          })
          if (!res.ok) { const e = await res.json().catch(() => ({})); return json({ error: e.error || 'Failed to send' }, 500) }

          // Track this email as invited
          const { data: invR } = await supabase.from('forum_settings').select('value').eq('key', 'forum_invited_emails').single()
          const invL = invR?.value || []
          if (!invL.includes(directEmail)) {
            invL.push(directEmail)
            await supabase.from('forum_settings').upsert({ key: 'forum_invited_emails', value: invL, updated_at: new Date().toISOString() }, { onConflict: 'key' })
          }
        } catch (e) { return json({ error: 'Failed: ' + e.message }, 500) }
        return json({ success: true })
      }

      case 'send-bulk-invite': {
        if (!isFounder) return json({ error: 'Only founder can send invites' }, 403)
        const { emails: bulkEmails } = body
        if (!bulkEmails?.length) return json({ error: 'No emails provided' }, 400)
        let sent = 0, failed = 0
        const { data: invR3 } = await supabase.from('forum_settings').select('value').eq('key', 'forum_invited_emails').single()
        const bulkInvList = invR3?.value || []
        for (const item of bulkEmails) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
              body: JSON.stringify({ to: item.email, subject: 'Join the CareCallAI Community Forum — Your Account is Ready', html: forumInviteHtml(item.name) }),
            })
            if (res.ok) { sent++; if (!bulkInvList.includes(item.email)) bulkInvList.push(item.email) } else { failed++ }
          } catch { failed++ }
        }
        if (sent > 0) {
          await supabase.from('forum_settings').upsert({ key: 'forum_invited_emails', value: bulkInvList, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        }
        return json({ success: true, sent, failed })
      }

      case 'invite-to-forum': {
        if (!isFounder) return json({ error: 'Only founder can send invites' }, 403)
        const { email, name } = body
        if (!email) return json({ error: 'Email required' }, 400)

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify({
              to: email,
              subject: 'Join the CareCallAI Community Forum — Your Account is Ready',
              html: forumInviteHtml(name),
            }),
          })
          if (!res.ok) { const e = await res.json().catch(() => ({})); return json({ error: e.error || 'Failed to send email' }, 500) }

          // Track this email as invited
          const { data: invRow } = await supabase.from('forum_settings').select('value').eq('key', 'forum_invited_emails').single()
          const invList = invRow?.value || []
          if (!invList.includes(email)) {
            invList.push(email)
            await supabase.from('forum_settings').upsert({ key: 'forum_invited_emails', value: invList, updated_at: new Date().toISOString() }, { onConflict: 'key' })
          }
        } catch (emailErr) {
          return json({ error: 'Failed to send invite: ' + emailErr.message }, 500)
        }

        return json({ success: true })
      }

      case 'send-forum-invite-all': {
        if (!isFounder) return json({ error: 'Only founder can send invites' }, 403)

        // Get org admins
        const { data: orgMems } = await supabase.from('organization_members').select('user_id, role').in('role', ['owner', 'admin'])
        if (!orgMems?.length) return json({ success: true, sent: 0, skipped: 0, failed: 0 })

        const uids = orgMems.map(m => m.user_id)
        const { data: profs } = await supabase.from('profiles').select('id, email, full_name').in('id', uids)
        const { data: fProfs } = await supabase.from('forum_profiles').select('id').in('id', uids)
        const forumIds = new Set((fProfs || []).map(f => f.id))

        // Get already-invited list
        const { data: invRow2 } = await supabase.from('forum_settings').select('value').eq('key', 'forum_invited_emails').single()
        const alreadyInvited = new Set(invRow2?.value || [])

        // Build send list — skip those who joined or were already invited
        const profMap = {}
        ;(profs || []).forEach(p => { profMap[p.id] = p })
        const toSend = []
        const seen = new Set()
        for (const m of orgMems) {
          const p = profMap[m.user_id]
          if (!p?.email || seen.has(p.email)) continue
          seen.add(p.email)
          if (forumIds.has(m.user_id)) continue // already joined
          if (alreadyInvited.has(p.email)) continue // already invited
          toSend.push({ email: p.email, name: p.full_name || '' })
        }

        let sent = 0, failed = 0
        const newInvited = [...alreadyInvited]
        for (const item of toSend) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
              body: JSON.stringify({ to: item.email, subject: 'Join the CareCallAI Community Forum — Your Account is Ready', html: forumInviteHtml(item.name) }),
            })
            if (res.ok) { sent++; newInvited.push(item.email) } else { failed++ }
          } catch { failed++ }
        }

        // Save updated invited list
        if (sent > 0) {
          await supabase.from('forum_settings').upsert({ key: 'forum_invited_emails', value: newInvited, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        }

        return json({ success: true, sent, failed, skipped: orgMems.length - toSend.length - (orgMems.length - Object.keys(profMap).length) })
      }

      case 'update-permissions': {
        if (!isFounder) return json({ error: 'Only founder can update permissions' }, 403)
        const { permissions: newPerms } = body
        if (!newPerms) return json({ error: 'permissions object required' }, 400)
        const { error: permErr } = await supabase.from('forum_settings')
          .upsert({ key: 'role_permissions', value: newPerms, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        if (permErr) return json({ error: permErr.message }, 500)
        return json({ success: true })
      }

      case 'delete-member': {
        if (!isFounder) return json({ error: 'Only founder can delete members' }, 403)
        if (!userId) return json({ error: 'userId required' }, 400)
        // Cannot delete yourself
        if (userId === user.id) return json({ error: 'Cannot delete your own profile' }, 400)
        // Delete their replies, threads, likes, notifications, then profile
        await supabase.from('forum_likes').delete().eq('user_id', userId)
        await supabase.from('forum_notifications').delete().eq('user_id', userId)
        await supabase.from('forum_notifications').delete().eq('actor_id', userId)
        await supabase.from('forum_replies').delete().eq('author_id', userId)
        await supabase.from('forum_threads').delete().eq('author_id', userId)
        await supabase.from('forum_profiles').delete().eq('id', userId)
        // Add to exclusion list so auto-provisioning doesn't re-create them
        const { data: exRow } = await supabase.from('forum_settings').select('value').eq('key', 'excluded_users').single()
        const excluded = exRow?.value || []
        if (!excluded.includes(userId)) {
          excluded.push(userId)
          await supabase.from('forum_settings').upsert({ key: 'excluded_users', value: excluded, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        }
        return json({ success: true })
      }

      case 'fix-founder': {
        if (!isFounder) return json({ error: 'Only founder' }, 403)
        const { username: newUsername, display_name, bio: newBio } = body
        const updates = { forum_role: 'founder' }
        if (newUsername) updates.username = newUsername.toLowerCase()
        if (display_name) updates.display_name = display_name
        if (newBio) updates.bio = newBio
        await supabase.from('forum_profiles').update(updates).eq('id', user.id)
        return json({ success: true })
      }

      case 'seed-intro-threads': {
        if (!isFounder) return json({ error: 'Only founder' }, 403)
        const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'
        const introThreads = [
          {
            category_id: '71759a2c-13be-4291-81dc-a7ba0d5e3cd8',
            slug: 'welcome-to-announcements',
            title: 'Welcome to Announcements',
            content: `# Welcome to the Announcements Board

This is the official channel for all **CareCallAI updates, new features, and important news**.

## What gets posted here

- **New feature releases** — detailed breakdowns of what's new and how to use it
- **Platform updates** — maintenance windows, performance improvements, and system changes
- **Regulatory updates** — changes to CIW or CQC requirements that affect your compliance
- **Community milestones** — user count achievements, partnerships, and celebrations

## How it works

- Only the **CareCallAI team** can post new announcements
- You **cannot reply** to announcements here to keep things clean
- If you have questions about an announcement, head over to **Help & Support** or **General Discussion**

## Stay informed

We recommend checking this board regularly. All major changes to CareCallAI will be announced here first before rolling out.

Thank you for being part of the CareCallAI community!`
          },
          {
            category_id: '8ed481f7-5796-4793-8c18-5a7c2d93478e',
            slug: 'welcome-to-feature-requests',
            title: 'Welcome to Feature Requests',
            content: `# Welcome to Feature Requests

This is where **you** shape the future of CareCallAI. We build this platform for care professionals, and your ideas directly influence what we develop next.

## How to submit a feature request

1. **Search first** — check if someone has already requested the same feature
2. **Create a new thread** with a clear, descriptive title (e.g. "Add PDF export for care plans")
3. **Describe the feature** — what would it do and how would it work?
4. **Explain why it matters** — how would this help your day-to-day care work?
5. **Add context** — are you using a workaround currently? Is this blocking you?

## How we prioritise

We review every request and prioritise based on:

- **Impact** — how many users would benefit
- **Compliance** — does it help meet CIW/CQC requirements
- **Effort** — how complex is the build
- **Votes** — features with more likes get higher priority

## What happens next

- We'll respond to let you know the request has been seen
- Popular requests get tagged with status updates: **Under Review**, **Planned**, **In Progress**, or **Shipped**
- When a feature ships, we'll link back to the original request so you know

Your feedback makes CareCallAI better for everyone. Don't hold back!`
          },
          {
            category_id: 'e4602e18-3d7b-4683-8905-47723bf9cda3',
            slug: 'welcome-to-general-discussion',
            title: 'Welcome to General Discussion',
            content: `# Welcome to General Discussion

This is the place for **open conversation** with fellow care professionals using CareCallAI.

## What belongs here

- **Introductions** — tell us about yourself, your organisation, and your role
- **Care sector chat** — share experiences, challenges, and wins from your work
- **Networking** — connect with other domiciliary care and care home managers
- **Off-topic** — anything that doesn't fit neatly into the other categories
- **Community events** — meetups, webinars, and training opportunities

## Guidelines

- Be respectful and professional — we're all working toward better care
- Keep confidential information out of posts (no service user names or details)
- If your post is about a **bug**, **feature request**, or **support question**, please use the relevant category instead
- Have fun and be supportive — this is your community

## Introduce yourself

Why not start by introducing yourself? Tell us:
- Your name and role
- What type of care service you run
- How long you've been using CareCallAI
- One thing you'd love to see improved

We look forward to hearing from you!`
          },
          {
            category_id: 'efc40e5c-caff-4e3e-b8ff-547f1ccbea12',
            slug: 'welcome-to-tips-and-best-practice',
            title: 'Welcome to Tips & Best Practice',
            content: `# Welcome to Tips & Best Practice

This category is for **sharing practical knowledge** that helps you get the most from CareCallAI and run your care service more effectively.

## What to share here

- **CareCallAI tips** — shortcuts, hidden features, workflows that save you time
- **Rota management** — how you structure shifts, manage patterns, handle last-minute changes
- **Care planning** — templates, approaches, and documentation strategies that work
- **Staff management** — supervision scheduling, training records, onboarding processes
- **Compliance shortcuts** — how to stay audit-ready with less effort
- **eMAR best practice** — medication management tips and error prevention
- **Family portal** — how to keep families engaged and informed

## Sharing format

When sharing a tip, try to include:

1. **What it is** — a clear title describing the tip
2. **The problem** — what challenge does this solve?
3. **The solution** — step-by-step how to do it
4. **The result** — what improvement you saw

## Why share?

Every care provider faces similar challenges. By sharing what works for you, you help the entire community deliver better care. And you might learn something new from others too!

Start sharing your best tips today.`
          },
          {
            category_id: 'b5b9adf5-1d15-42c9-82b2-e39f83d3d665',
            slug: 'welcome-to-ciw-compliance',
            title: 'Welcome to CIW Compliance',
            content: `# Welcome to CIW Compliance

This category is dedicated to **Care Inspectorate Wales (CIW)** compliance — everything you need to stay compliant under the **Regulation and Inspection of Social Care (Wales) Act 2016 (RISCA)**.

## What belongs here

- **RISCA regulations** — discussion of specific regulations and how CareCallAI helps you meet them
- **Inspection preparation** — how to prepare for CIW inspections using CareCallAI
- **Annual returns** — tips for completing your CIW annual return efficiently
- **Statement of Purpose** — guidance on updating and maintaining your Statement of Purpose
- **Staff compliance** — DBS checks, mandatory training, supervision (Reg 36), and fitness requirements
- **Quality of care** — Regulation 21 reviews, outcomes-based reporting, and evidence gathering
- **Safeguarding** — reporting requirements, policies, and CareCallAI safeguarding tools
- **Notifications** — which events must be reported to CIW and how

## CareCallAI compliance features

CareCallAI has built-in tools for CIW compliance:

- **Pre-populated CIW forms** with regulation guidance
- **12-weekly supervision tracking** (RISCA Reg 36)
- **Compliance filing** with regulation-specific forms
- **Safeguarding incident reporting**
- **Staff training and DBS tracking**

## Ask questions, share knowledge

Whether you're newly registered or an experienced provider, this is your space to discuss CIW requirements and learn from each other. No question is too basic!`
          },
          {
            category_id: 'e42ba333-0772-4537-ad22-334832b5f625',
            slug: 'welcome-to-cqc-compliance',
            title: 'Welcome to CQC Compliance',
            content: `# Welcome to CQC Compliance

This category is for **Care Quality Commission (CQC)** compliance in England — helping you meet the requirements of the **Health and Social Care Act 2008** and the new **Single Assessment Framework**.

## What belongs here

- **CQC Key Questions** — Safe, Effective, Caring, Responsive, and Well-Led
- **Evidence statements** — how to demonstrate quality and compliance through CareCallAI
- **Inspection preparation** — what CQC inspectors look for and how to be ready
- **PIR (Provider Information Return)** — tips for completing your PIR efficiently
- **Rating improvement** — strategies for moving from Requires Improvement to Good, or Good to Outstanding
- **Regulation 18 (Staffing)** — supervision, training, competency assessments
- **Regulation 12 (Safe care)** — risk assessments, medication management, safeguarding
- **Notifications** — statutory notifications to CQC and how to submit them

## CareCallAI compliance features

CareCallAI supports CQC compliance through:

- **Compliance management** with regulation filing and guidance
- **Staff supervision tracking** (Reg 18)
- **Clinical assessments** — Waterlow, MUST, Falls Risk, NEWS2, and more
- **Care logging** with evidence-based documentation
- **Safeguarding** and incident reporting

## Join the conversation

Share your inspection experiences, ask about specific regulations, or help others prepare for their next CQC visit. Together we can raise standards across the sector.`
          },
          {
            category_id: '98c52d96-97bb-4d9a-af3a-9f5569a654c0',
            slug: 'welcome-to-help-and-support',
            title: 'Welcome to Help & Support',
            content: `# Welcome to Help & Support

This is the go-to place when you need **help with CareCallAI**. Whether you're stuck on something, can't find a feature, or need guidance, ask here.

## Before you post

1. **Check User Documentation** — your question may already be answered in our comprehensive user guides
2. **Search existing threads** — someone may have already asked the same question
3. **Check Announcements** — recent changes might explain what you're seeing

## How to ask for help

To get the fastest and most helpful response, please include:

- **What you're trying to do** — describe the task or goal
- **What's happening** — describe the issue or unexpected behaviour
- **What you expected** — what should have happened instead
- **Screenshots** — if possible, include a screenshot showing the problem
- **Device info** — are you on mobile (iOS/Android), tablet, or desktop?

## Response times

- The CareCallAI team monitors this board regularly
- Community members may also help with common questions
- For urgent issues, use the **Book a Session** option to schedule a free call

## Book a Free Teams Meeting

Need hands-on help? You can book a **free Microsoft Teams session** with the CareCallAI team for:
- Live walkthroughs of features
- Troubleshooting specific issues
- Training for your team
- Setup and configuration help

Look for the **Book a Session** thread pinned in this category, or visit [carecallai.co.uk/booking](https://www.carecallai.co.uk/booking).

We're here to help!`
          },
        ]

        // Check which already exist
        const slugs = introThreads.map(t => t.slug)
        const { data: existing } = await supabase.from('forum_threads').select('slug').in('slug', slugs)
        const existingSlugs = new Set((existing || []).map(t => t.slug))

        let created = 0
        for (const t of introThreads) {
          if (existingSlugs.has(t.slug)) continue
          const { error: insertErr } = await supabase.from('forum_threads').insert({
            ...t,
            author_id: FOUNDER_ID,
            is_pinned: true,
            is_locked: true,
          })
          if (!insertErr) created++
        }

        return json({ success: true, created, skipped: introThreads.length - created })
      }

      default:
        return json({ error: 'Unknown action' }, 400)
    }
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}
