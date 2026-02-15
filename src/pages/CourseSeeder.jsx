import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, BookOpen, ShieldCheck, Heart } from 'lucide-react';
import { toast } from 'sonner';

// ─── COURSE 1: First Aid, CPR & AED (UK Protocol) ───────────────────────────

const FIRST_AID_COURSE = {
  title: 'First Aid, CPR & AED — UK Protocol',
  description: 'A comprehensive first aid course aligned with UK Resuscitation Council 2021 guidelines and HSE requirements. Covers primary assessment (DR ABC), adult CPR, AED use, recovery position, choking, and common emergencies. Includes video demonstrations from St John Ambulance and the British Red Cross.',
  category: 'mandatory',
  difficulty_level: 'Beginner',
  duration_minutes: 180,
  passing_score: 80,
  expiry_days: 365,
  modules: [
    {
      title: 'Module 1: Introduction to First Aid in the UK',
      description: 'Understand the legal framework, your responsibilities, and what every first aid kit should contain.',
      order_index: 0,
      lessons: [
        {
          title: 'The Legal Framework',
          description: 'UK legislation that governs first aid in the workplace and community.',
          order_index: 0,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/6gWq9PZTVtU',
          content: `# The Legal Framework for First Aid in the UK

## Overview
First aid in the UK is governed by several key pieces of legislation. Understanding your legal responsibilities helps you act confidently in an emergency.

## Key Legislation

### Health and Safety (First Aid) Regulations 1981
These regulations require employers to provide **adequate and appropriate** first aid equipment, facilities, and personnel. Every workplace must have:
- A suitably stocked first aid kit
- An appointed person to take charge of first aid arrangements
- Information for employees about first aid arrangements

### Health and Safety at Work Act 1974
This is the primary piece of UK health and safety legislation. It places a **general duty** on employers to ensure, so far as is reasonably practicable, the health, safety, and welfare of their employees.

### The Social Action, Responsibility and Heroism Act 2015
This Act provides reassurance to people who are **acting heroically** or in the interests of others. If you act in good faith and without negligence, the courts will consider this when assessing any claim.

## Good Samaritan Principle
In the UK, there is **no legal obligation** for members of the public to provide first aid. However, if you choose to help, you are protected by law as long as you:
- Act in good faith
- Act within your competence
- Do not act with gross negligence

## The Duty of Care
If you are a designated **first aider at work**, you DO have a duty of care to those in your workplace. This means you must:
- Respond promptly to emergencies
- Provide first aid to the level of your training
- Call for professional medical help when needed
- Keep accurate records of any treatment given

> **Remember:** The most important thing you can do in any emergency is call **999** (or **112**) for professional help. You are not expected to diagnose or treat conditions beyond your training.`
        },
        {
          title: 'First Aider Responsibilities',
          description: 'What is expected of you as a first aider in a care setting.',
          order_index: 1,
          content_type: 'text',
          content: `# Your Responsibilities as a First Aider

## The Role of a First Aider
A first aider is someone who has received training to give **immediate help** to a casualty until professional medical help arrives. Your role is to:

1. **Preserve life** — this is your primary objective
2. **Prevent the condition from worsening** — protect the casualty from further harm
3. **Promote recovery** — help the casualty recover, both physically and emotionally

## In a Care Setting
Working in domiciliary care or a care home, you may be the **only trained person** present when an emergency occurs. You need to:

- **Stay calm** — your composure reassures the casualty and helps you think clearly
- **Assess the situation** — look for dangers before approaching
- **Call for help** — dial 999/112 or ask someone else to call
- **Provide first aid** — to the level of your training
- **Hand over** — give a clear handover to the ambulance crew when they arrive
- **Record** — document everything in the care notes and complete an incident report

## What to Include in Your Handover
Use the **ASHICE** mnemonic when handing over to the ambulance service:

| Letter | Meaning |
|--------|---------|
| **A** | Age of the casualty |
| **S** | Sex of the casualty |
| **H** | History — what happened |
| **I** | Injuries or illness found |
| **C** | Condition — conscious, breathing, etc. |
| **E** | Expected time of arrival (if transporting) |

## Emotional Wellbeing
Responding to an emergency can be **stressful**. After an incident:
- Talk to your manager or a colleague about how you feel
- It's normal to feel shaky, upset, or anxious afterwards
- Seek professional support if you continue to feel affected

> **Key Point:** You are not a doctor. Your job is to keep the person alive and as comfortable as possible until the professionals arrive.`
        },
        {
          title: 'First Aid Kit Contents',
          description: 'What must be in a UK-compliant first aid kit and where to find it.',
          order_index: 2,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/gn6xt1ca8A0',
          content: `# First Aid Kit Contents — UK Requirements

## HSE Minimum Requirements
The Health and Safety Executive (HSE) provides guidance on the **minimum contents** of a first aid kit for a workplace with fewer than 25 employees:

| Item | Quantity |
|------|----------|
| Guidance leaflet | 1 |
| Individually wrapped sterile plasters (assorted) | 20 |
| Sterile eye pads | 2 |
| Individually wrapped triangular bandages | 4 |
| Safety pins | 6 |
| Medium sterile dressings (12cm × 12cm) | 6 |
| Large sterile dressings (18cm × 18cm) | 2 |
| Disposable gloves (pairs) | 6 |
| Sterile wound cleaning wipes | 6 |
| Microporous tape | 1 roll |
| Scissors | 1 pair |
| Face shield / pocket mask for CPR | 1 |
| Foil blanket | 2 |

## Additional Items for Care Settings
In a care setting, you may also want to include:
- **Burn gel sachets** — for treating minor burns and scalds
- **Glucose tablets** — for service users with diabetes
- **A list of service users' medications and conditions**
- **Spare EpiPen** (if prescribed to a service user)

## Important Rules
- First aid kits must be **clearly marked** with a white cross on a green background
- Check your kit **regularly** — replace used or expired items promptly
- Kits should be **easily accessible** — everyone should know where they are
- **Do not include medications** (such as paracetamol) in workplace first aid kits — this is against HSE guidance

## Your Vehicle Kit
If you are a mobile care worker, keep a small first aid kit in your car. The minimum should include:
- Plasters, sterile dressings, gloves, a face shield, and a foil blanket

> **Remember:** A fully stocked first aid kit is useless if nobody knows where it is. Make sure every team member knows the location of all first aid kits in your care setting.`
        }
      ]
    },
    {
      title: 'Module 2: Primary Assessment — DR ABC',
      description: 'Learn the systematic approach to assessing a casualty using the DR ABC framework.',
      order_index: 1,
      lessons: [
        {
          title: 'Danger, Response, Airway, Breathing, Circulation',
          description: 'The DR ABC primary survey explained step by step.',
          order_index: 0,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/ea1RJUOiNfQ',
          content: `# Primary Assessment — DR ABC

## Why DR ABC?
The DR ABC framework gives you a **systematic approach** to assess any casualty. Following these steps in order ensures you don't miss anything critical.

## The Steps

### D — Danger
Before you approach, check for **dangers** to yourself, bystanders, and the casualty:
- Is there traffic, fire, electricity, gas, or structural instability?
- Can you make the area safe, or do you need to wait for the emergency services?
- **Never put yourself at risk** — you cannot help if you become a casualty too

### R — Response
Check if the casualty is **responsive**:
1. Speak loudly: *"Hello, can you hear me? Open your eyes!"*
2. Gently shake their shoulders
3. If they respond — ask what happened, keep them still, call for help if needed
4. If NO response — shout for help and move to the next step

### A — Airway
Open the casualty's **airway**:
1. Place one hand on the forehead and gently tilt the head back
2. Lift the chin with two fingertips under the bony part of the chin
3. This lifts the tongue away from the back of the throat
4. Look inside the mouth — remove any visible obstructions (but **never** blindly sweep)

### B — Breathing
Check for **normal breathing** for up to 10 seconds:
1. **Look** — for chest movement
2. **Listen** — for breathing sounds at their mouth
3. **Feel** — for breath on your cheek
4. If breathing normally — place in the **recovery position** and call 999
5. If NOT breathing normally — call **999 immediately** and start **CPR**

### C — Circulation
Look for signs of **severe bleeding**:
1. Quickly scan the body for blood loss
2. Apply **direct pressure** to any wound that is bleeding heavily
3. If available, use a sterile dressing

> **Key Point:** The entire DR ABC check should take no more than **30 seconds**. Speed saves lives.`
        },
        {
          title: 'Calling 999 / 112',
          description: 'How to make an effective emergency call and what information to provide.',
          order_index: 1,
          content_type: 'text',
          content: `# Calling the Emergency Services

## When to Call 999 (or 112)
Call **999** if someone:
- Is unconscious or unresponsive
- Is not breathing or breathing abnormally
- Is having a heart attack or stroke
- Has severe bleeding that won't stop
- Is choking and back blows aren't working
- Is having a severe allergic reaction (anaphylaxis)
- Has a serious injury (e.g. suspected spinal injury, deep wound)

**112** works across Europe and from mobile phones even without signal on your network.

## What to Say
When you call, the operator will ask you:

1. **Which service do you need?** — Say "Ambulance"
2. **What is the address / location?** — Be as specific as possible. Include:
   - Full address and postcode
   - Floor or flat number
   - Landmarks ("opposite the Tesco Express")
   - For mobile care workers: use the **what3words** app for a precise location
3. **What has happened?** — Brief description: "A 78-year-old woman has collapsed and is not breathing"
4. **Is the patient breathing?** — The operator will guide you
5. **How many casualties?** — Tell them if there are multiple

## Important Tips
- **Put the phone on speaker** so you can provide first aid while talking
- **Do NOT hang up** — the operator may need to give you instructions
- If you are alone, call 999 FIRST, then start CPR (the operator will talk you through it)
- If someone else is present, ask THEM to call while YOU start first aid
- **Stay on the line** until told you can hang up

## In a Care Setting
- Have the **service user's care plan** ready to share with paramedics
- Know the service user's **medications, allergies, and conditions**
- Have the **GP's contact details** available
- Unlock the front door so paramedics can enter quickly

> **Remember:** The operator is trained to help you. They will guide you through CPR or other first aid steps if you're unsure. You are NOT alone.`
        },
        {
          title: 'Performing a Primary Survey',
          description: 'Practical walkthrough of the complete primary survey process.',
          order_index: 2,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/ea1RJUOiNfQ',
          content: `# Performing a Primary Survey — Practical Walkthrough

## Scenario
You arrive at a service user's home and find them collapsed on the floor. Here's exactly what you do:

## Step-by-Step

### 1. Check for Danger
- Look around the room — is there anything that could hurt you?
- Are there tripping hazards, spilled liquids, or electrical items near water?
- Is the environment safe for you to approach?

### 2. Check for Response
- Kneel beside the person
- Speak loudly: *"Mrs Jones, can you hear me? Open your eyes!"*
- Gently shake both shoulders
- **No response?** → Shout "HELP!" to alert anyone nearby

### 3. Open the Airway
- Gently roll them onto their back if they aren't already
- Place your hand on their forehead
- Tilt the head back
- Lift the chin with two fingers
- The airway is now open

### 4. Check Breathing (10 seconds)
- Put your ear close to their mouth and nose
- **Look** at the chest for movement
- **Listen** for breathing sounds
- **Feel** for breath on your cheek
- Count: "One thousand, two thousand..." up to ten thousand

### If They ARE Breathing
- Place them in the **recovery position** (covered in Module 5)
- Call 999
- Monitor their breathing continuously
- Keep them warm with a blanket

### If They Are NOT Breathing
- Call **999** immediately (or ask someone to call)
- Begin **CPR** (covered in Module 3)
- Ask someone to fetch an **AED** if available

### 5. Check for Severe Bleeding
- Run your hands quickly over the body (wearing gloves if possible)
- Check under the back and legs — blood can pool underneath
- Apply direct pressure to any serious wound

## Common Mistakes to Avoid
- Spending too long on any one step — be systematic but **fast**
- Forgetting to check for danger first
- Not opening the airway properly — a blocked airway kills faster than most injuries
- Confusing **agonal breathing** (occasional gasps) with normal breathing — agonal breathing means you must start CPR

> **Key Point:** Practice makes this feel natural. The more you rehearse DR ABC, the faster and more confident you'll be in a real emergency.`
        }
      ]
    },
    {
      title: 'Module 3: Adult CPR — UK Resuscitation Council Guidelines',
      description: 'Learn when and how to perform CPR on an adult, following the latest UK Resuscitation Council 2021 guidelines.',
      order_index: 2,
      lessons: [
        {
          title: 'When to Start CPR',
          description: 'Recognising cardiac arrest and understanding when CPR is needed.',
          order_index: 0,
          content_type: 'text',
          content: `# When to Start CPR

## What is Cardiac Arrest?
Cardiac arrest occurs when the heart **stops pumping blood** around the body. Without CPR, the brain begins to die within **3–4 minutes**. CPR keeps blood flowing to the brain and vital organs until a defibrillator or ambulance arrives.

## Start CPR If:
- The casualty is **unresponsive** (does not respond to shaking and shouting)
- They are **not breathing normally** (no breathing, or only occasional gasps)

## Do NOT Delay
- If you are **unsure** whether they are breathing normally — **start CPR**. It is better to give CPR to someone who doesn't need it than to withhold it from someone who does.
- **Agonal breathing** (irregular gasps, snoring sounds) is NOT normal breathing — start CPR.

## Key Facts (UK Resuscitation Council 2021)
- Around **30,000 out-of-hospital cardiac arrests** occur in the UK each year
- Currently, only about **1 in 10** people survive
- **Bystander CPR** doubles or triples the chance of survival
- Every **minute without CPR** reduces the chance of survival by **7–10%**

## Chain of Survival
The UK Resuscitation Council describes four links in the **Chain of Survival**:

1. **Early recognition** — recognise cardiac arrest and call 999
2. **Early CPR** — start chest compressions immediately
3. **Early defibrillation** — use an AED as soon as one is available
4. **Early advanced care** — paramedics and hospital treatment

**You** can provide the first three links. Your actions in the first few minutes are the single biggest factor in whether someone survives.

> **Remember:** You CANNOT make things worse by starting CPR on someone in cardiac arrest. They are already clinically dead — you can only help.`
        },
        {
          title: 'The 30:2 Technique',
          description: 'How to perform chest compressions and rescue breaths in the correct ratio.',
          order_index: 1,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/BQNNOh8c8ks',
          content: `# Adult CPR — The 30:2 Technique

## Before You Start
1. The casualty must be on a **firm, flat surface** (the floor — not a bed or sofa)
2. Kneel beside them at the level of their chest
3. Make sure 999 has been called

## Chest Compressions

### Hand Position
1. Place the **heel of one hand** on the centre of the chest (on the lower half of the breastbone / sternum)
2. Place your **other hand on top** and interlock your fingers
3. Keep your fingers **off the ribs**

### Technique
1. Keep your arms **straight** — lock your elbows
2. Position your shoulders **directly above** your hands
3. Press down **5–6 cm** (about 2 inches)
4. Push at a rate of **100–120 compressions per minute**
5. Allow the chest to **fully recoil** between compressions — don't lean on the chest
6. Give **30 compressions**

### Timing Tip
Push to the beat of *"Stayin' Alive"* by the Bee Gees — it's exactly 104 beats per minute.

## Rescue Breaths

After 30 compressions, give **2 rescue breaths**:

1. Open the airway — **head tilt, chin lift**
2. Pinch the nose closed with your thumb and index finger
3. Take a normal breath, place your mouth over theirs making a **seal**
4. Blow steadily for about **1 second** watching for the chest to rise
5. If the chest rises — give a **second breath**
6. If the chest doesn't rise — reposition the head and try again
7. Don't attempt more than 2 breaths — return to compressions

## The Cycle
- **30 compressions → 2 breaths → 30 compressions → 2 breaths**
- Continue without stopping until:
  - The ambulance arrives and takes over
  - An AED is available and ready to analyse
  - The casualty starts breathing normally
  - You become too exhausted to continue (swap with another rescuer if possible)

## Compression-Only CPR
If you are **unable or unwilling** to give rescue breaths:
- Give **continuous chest compressions** at 100–120 per minute
- This is still highly effective and much better than doing nothing
- The 999 operator will guide you through this

> **Key Point:** Push hard, push fast, and don't stop. Effective CPR is tiring — if someone else is available, swap every 2 minutes to maintain quality.`
        },
        {
          title: 'Hands-Only CPR',
          description: 'When and how to perform compression-only CPR effectively.',
          order_index: 2,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/O92KL1mw77c',
          content: `# Hands-Only CPR

## When to Use Hands-Only CPR
Hands-only CPR (compression-only CPR) is appropriate when:
- You are **untrained** or **unsure** about giving rescue breaths
- You are **unwilling** to give mouth-to-mouth (this is your right)
- You are performing CPR on a **stranger** and have no face shield
- A **999 operator** is guiding you (they often advise compression-only for telephone CPR)

## How to Perform Hands-Only CPR

1. **Call 999** — put the phone on speaker
2. Place the casualty on a **firm, flat surface**
3. Kneel beside them
4. Place the **heel of one hand** in the centre of the chest
5. Place your **other hand on top**, fingers interlocked
6. Keep your arms **straight**
7. Push **hard and fast** — 5–6 cm deep, 100–120 per minute
8. **Do not stop** until help arrives

## Is Hands-Only CPR Effective?
**Yes!** Research shows that hands-only CPR is nearly as effective as full CPR with rescue breaths for the first few minutes of a cardiac arrest in adults. Here's why:

- When the heart stops, there is still **oxygen in the blood** for several minutes
- Chest compressions keep that oxygenated blood **circulating**
- The key priority is **blood flow**, not new oxygen
- After about 8–10 minutes, rescue breaths become more important

## The British Heart Foundation Message
The British Heart Foundation's campaign is simple:

> **Call 999. Push hard and fast to the beat of Stayin' Alive. Don't stop until help arrives.**

## Practice Makes Perfect
- Practice on a pillow at home to get a feel for the depth and speed
- Use a metronome app set to 110 bpm
- Remember: **any CPR is better than no CPR**

> **Key Point:** If you only remember one thing from this course, remember this: if someone collapses and isn't breathing, call 999, push hard and fast in the centre of the chest, and don't stop. That alone can save a life.`
        }
      ]
    },
    {
      title: 'Module 4: Using an Automated External Defibrillator (AED)',
      description: 'Learn how AEDs work and how to use one confidently in an emergency.',
      order_index: 3,
      lessons: [
        {
          title: 'How AEDs Work',
          description: 'Understanding what a defibrillator does and why it saves lives.',
          order_index: 0,
          content_type: 'text',
          content: `# How Automated External Defibrillators Work

## What is an AED?
An Automated External Defibrillator (AED) is a portable device that can **analyse the heart's rhythm** and deliver an electrical shock (defibrillation) to restore a normal heartbeat. AEDs are designed to be used by **anyone** — you do not need medical training.

## Why AEDs Save Lives
In most cardiac arrests, the heart goes into a chaotic rhythm called **ventricular fibrillation (VF)**. The heart quivers instead of pumping blood. The ONLY treatment for VF is an **electric shock** from a defibrillator.

- **CPR alone** cannot restart the heart — but it keeps blood flowing until a shock can be given
- For every minute without defibrillation, the chance of survival drops by **10%**
- If a shock is delivered within **3–5 minutes**, survival rates can be as high as **50–70%**

## How the AED Works
1. **You apply two sticky pads** to the casualty's bare chest
2. The AED **analyses the heart rhythm** automatically
3. If a shockable rhythm is detected, the AED tells you to **press the shock button**
4. If no shock is needed, the AED tells you to **continue CPR**
5. The AED **cannot deliver a shock by accident** — it only allows a shock when one is needed

## Where to Find AEDs
In the UK, AEDs are increasingly available in public places:
- Shopping centres and supermarkets
- Train stations and airports
- Sports centres and gyms
- Schools and universities
- Workplaces and offices
- Village halls and community centres
- Some telephone boxes (converted by community groups)

You can find your nearest AED using the **DefibFinder** app or at [heartsafe.org.uk](https://heartsafe.org.uk).

## Key Reassurances
- AEDs are **foolproof** — they will NOT shock someone who doesn't need it
- You **cannot harm** someone by using an AED correctly
- The machine gives **voice prompts** that talk you through every step
- You do not need to know what rhythm the heart is in — the AED decides for you

> **Remember:** An AED plus CPR is the winning combination. CPR buys time; the AED fixes the problem.`
        },
        {
          title: 'Step-by-Step AED Use',
          description: 'A practical guide to using an AED in a real emergency.',
          order_index: 1,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/UFvL7wTFzl0',
          content: `# Using an AED — Step by Step

## Before Using the AED
- Ensure **999 has been called**
- **CPR should already be in progress** — do not stop CPR to wait for the AED
- When the AED arrives, turn it on and follow its voice prompts

## Step-by-Step Guide

### Step 1: Turn On the AED
- Press the **ON/power button** or open the lid (some AEDs turn on automatically when opened)
- The AED will start giving you **voice instructions** — listen carefully and follow them

### Step 2: Attach the Pads
- Remove or cut away clothing from the **bare chest**
- Dry the chest if wet (the pads won't stick to wet skin)
- Peel the pads from their packaging
- Place **Pad 1** on the upper right chest (below the collarbone, to the right of the breastbone)
- Place **Pad 2** on the lower left side (under the left armpit, on the side of the ribs)
- The pads have pictures showing you where to place them
- Press the pads down firmly

### Step 3: Analysing
- The AED will say *"Analysing heart rhythm — do not touch the patient"*
- **Stand clear** — make sure nobody is touching the casualty
- The AED will determine if a shock is needed

### Step 4a: Shock Advised
- The AED will say *"Shock advised — press the shock button"*
- Shout **"STAND CLEAR!"** and visually check nobody is touching the casualty
- Press the **flashing shock button**
- The casualty may jerk — this is normal
- Immediately **resume CPR** (30:2) for 2 minutes
- The AED will tell you when to stop for re-analysis

### Step 4b: No Shock Advised
- The AED will say *"No shock advised — continue CPR"*
- Immediately **resume CPR** (30:2) for 2 minutes
- The AED will re-analyse after 2 minutes

## Special Situations

| Situation | Action |
|-----------|--------|
| Hairy chest | Shave the area (most AED kits include a razor) or press pads down firmly |
| Wet chest | Dry the chest quickly before applying pads |
| Pacemaker (hard lump under skin) | Place pads at least **2.5 cm away** from the device |
| Medication patches on chest | Remove the patch and wipe the area before placing pads |
| Pregnant woman | Use the AED as normal — it is safe |
| Child (1-8 years) | Use paediatric pads if available; otherwise use adult pads |

> **Key Point:** Do not be afraid to use an AED. It will tell you exactly what to do. You cannot make a mistake — the machine won't let you.`
        },
        {
          title: 'AED Safety Considerations',
          description: 'Important safety information when using an AED.',
          order_index: 2,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/7aX1EwkC1yY',
          content: `# AED Safety Considerations

## Safety First
Although AEDs are extremely safe, there are a few important precautions:

### Before Shocking
- **Shout "STAND CLEAR!"** every time the AED is about to deliver a shock
- **Visually check** that nobody is touching the casualty — including yourself
- Make sure the casualty is not lying in a **puddle of water** (move them if needed, but you don't need to worry about a damp surface)
- Remove any **oxygen masks** from the casualty's face before shocking (but keep the supply nearby)

### Metal Surfaces
- It IS safe to use an AED if the casualty is on a **metal surface** (e.g., a metal floor, train tracks)
- The electricity follows the path between the two pads through the chest — it does not travel into the ground

### Flammable Atmospheres
- Do NOT use an AED in a **flammable atmosphere** (e.g., near gas leaks)
- Move the casualty to a safe area first if possible

## After the AED Has Been Used
- Leave the pads attached even if the casualty starts breathing
- If they start breathing normally, place them in the **recovery position** with the AED pads still attached
- Continue to monitor them until the ambulance arrives
- If they stop breathing again, resume CPR and let the AED re-analyse

## Maintaining AEDs
If your workplace or care setting has an AED:
- Check it **regularly** (most AEDs have a self-check feature with a green light)
- Ensure pads are **in date** — replace expired pads
- Check the **battery level** — replace batteries as recommended by the manufacturer
- Register your AED with **The Circuit** (thecircuit.uk) so the ambulance service knows it exists

## Legal Protection
Under UK law, you are **fully protected** when using an AED in an emergency:
- You do not need to be trained to use one (though training helps build confidence)
- You cannot be sued for using an AED in good faith
- The device is designed to prevent misuse — it will not shock someone who doesn't need it

> **Key Point:** Every workplace and care setting should know where the nearest AED is. Seconds matter in cardiac arrest — know your nearest AED today.`
        }
      ]
    },
    {
      title: 'Module 5: Recovery Position & Choking',
      description: 'Master the recovery position technique and learn how to help a choking adult.',
      order_index: 4,
      lessons: [
        {
          title: 'The Recovery Position',
          description: 'When and how to place an unconscious, breathing casualty in the recovery position.',
          order_index: 0,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/GmqXqwSV3bo',
          content: `# The Recovery Position

## When to Use It
Place a casualty in the recovery position when they are:
- **Unconscious** (not responding to voice or touch)
- **Breathing normally** (you have checked for at least 10 seconds)
- **Not suspected of having a spinal injury**

The recovery position keeps the **airway open** and allows fluids (such as vomit or blood) to drain from the mouth, preventing choking.

## Step-by-Step Guide

### Starting Position
The casualty should be on their **back** on a flat surface.

### Step 1
- Kneel beside the casualty
- Place the **arm nearest to you** at a right angle to the body, with the elbow bent and palm facing up

### Step 2
- Take the **far arm** and bring it across the chest
- Hold the back of their hand against the **cheek nearest to you**
- Keep holding it there

### Step 3
- With your other hand, grasp the **far knee** and pull it up so the foot is flat on the floor

### Step 4
- Keeping their hand pressed against their cheek, pull on the **bent knee** to roll them towards you onto their side

### Step 5
- Adjust the top leg so the hip and knee are **both at right angles**
- **Tilt the head back** to keep the airway open
- Adjust the hand under the cheek to maintain the head position
- Check the mouth is **pointing downwards** so fluids can drain

## After Placing Them in the Recovery Position
- Call **999** if you haven't already
- Check breathing **regularly** — at least every minute
- Keep them **warm** with a blanket
- If they have been in the recovery position for **30 minutes**, roll them onto the opposite side
- If they **stop breathing** at any point — roll them onto their back and start CPR

## When NOT to Use the Recovery Position
- If you suspect a **spinal injury** — keep them still and hold the head steady
- If they are **not breathing** — start CPR immediately
- If they have a **severe injury** that prevents rolling (e.g., impaled object)

> **Key Point:** The recovery position is one of the most important skills in first aid. It can prevent an unconscious person from choking on their own vomit. Learn it, practise it, and you could save a life.`
        },
        {
          title: 'Adult Choking — Back Blows & Abdominal Thrusts',
          description: 'How to recognise and treat choking in adults using UK guidelines.',
          order_index: 1,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/HGBBu4zr8sM',
          content: `# Choking in Adults

## Recognising Choking
Choking occurs when an object **partially or fully blocks the airway**. Common signs include:

### Mild Obstruction (can still cough)
- Able to speak, cry, or cough
- Distressed and may be clutching their throat
- Can still breathe, though it may be noisy

### Severe Obstruction (cannot cough)
- Unable to speak, breathe, or cough
- May be making a **silent attempt** to cough
- Face may be turning **red or blue**
- May be clutching their throat (the universal choking sign)
- May become **unconscious** if not treated

## Treatment

### For Mild Obstruction
- **Encourage them to cough** — coughing is the most effective way to clear a blockage
- Stay with them and monitor
- Do NOT slap their back — this could dislodge the object further down

### For Severe Obstruction — Step 1: Back Blows
1. Stand to the **side and slightly behind** the casualty
2. Support their chest with one hand and lean them **well forward**
3. Give up to **5 sharp back blows** between the shoulder blades with the heel of your hand
4. Check the mouth after each blow — has the object come out?
5. If the obstruction clears — stop immediately

### For Severe Obstruction — Step 2: Abdominal Thrusts
If back blows don't work:
1. Stand **behind the casualty**
2. Place both arms around the upper part of their abdomen
3. Clench your fist and place it between the **navel and the bottom of the breastbone**
4. Grasp your fist with your other hand
5. Pull **sharply inwards and upwards** — up to 5 times
6. Check the mouth after each thrust

### If Still Choking
- **Alternate** between 5 back blows and 5 abdominal thrusts
- Call **999** if the obstruction does not clear after the first cycle
- Continue until the object is dislodged, help arrives, or they become unconscious

### If They Become Unconscious
- Lower them carefully to the ground
- Call **999** immediately
- Begin **CPR** — start with chest compressions (even if you can feel a pulse)
- Check the mouth before each set of rescue breaths — remove any visible object

## After Choking
If abdominal thrusts were used, the casualty should be **checked by a doctor** as internal bruising can occur.

> **Key Point:** In a care setting, be aware that older adults and those with swallowing difficulties are at **higher risk** of choking. Ensure food is prepared appropriately and that you know each service user's dietary requirements.`
        }
      ]
    },
    {
      title: 'Module 6: Common Emergencies',
      description: 'How to manage severe bleeding, burns, fractures, and anaphylaxis.',
      order_index: 5,
      lessons: [
        {
          title: 'Severe Bleeding & Shock',
          description: 'How to control severe bleeding and recognise the signs of shock.',
          order_index: 0,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/NxO5LvgqZe0',
          content: `# Severe Bleeding & Shock

## Treating Severe Bleeding

### Step 1: Apply Direct Pressure
1. Put on **disposable gloves** if available
2. Apply **firm, direct pressure** to the wound using a sterile dressing or clean cloth
3. If a dressing becomes soaked through, **add another on top** — do not remove the first one
4. Maintain pressure for at least **10 minutes**

### Step 2: Elevate
- If possible, raise the injured limb **above the level of the heart**
- This helps reduce blood flow to the wound
- Do NOT elevate if you suspect a **fracture**

### Step 3: Bandage
- Once bleeding is controlled, secure the dressing with a bandage
- Check circulation beyond the bandage regularly — fingers or toes should be **warm and pink**
- If circulation is compromised, loosen the bandage slightly

### When to Call 999
- Bleeding that won't stop after 10 minutes of direct pressure
- Blood is **spurting** from the wound (arterial bleeding)
- There is a large or deep wound
- There is an **embedded object** — do NOT remove it; bandage around it

## Recognising Shock
Shock occurs when the body's organs don't receive enough oxygenated blood. In first aid, this usually follows severe blood loss.

### Signs of Shock
- Pale, cold, clammy skin
- Rapid, weak pulse
- Rapid, shallow breathing
- Feeling dizzy or faint
- Nausea or vomiting
- Confusion or anxiety
- Thirst
- Grey-blue skin colour (especially around lips and ears)

### Treating Shock
1. Call **999** immediately
2. Lay the casualty down and raise their legs (unless injured)
3. Keep them **warm** with a blanket or coat
4. Do NOT give them anything to eat or drink
5. Loosen any tight clothing
6. Monitor breathing and be prepared to start CPR if they become unresponsive

> **Remember:** Shock is a life-threatening condition. Always call 999 if you suspect someone is going into shock.`
        },
        {
          title: 'Burns, Fractures & Anaphylaxis',
          description: 'Managing burns and scalds, suspected fractures, and severe allergic reactions.',
          order_index: 1,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/2v8vlXgGXwE',
          content: `# Burns, Fractures & Anaphylaxis

## Burns & Scalds

### Immediate Treatment
1. **Cool the burn** under cool running water for **at least 20 minutes** (not ice-cold)
2. Call 999 if the burn is larger than the casualty's hand, on the face/hands/feet/genitals, or is a deep burn
3. While cooling, remove any **clothing or jewellery** near the burn (unless stuck to the skin)
4. After cooling, cover with **cling film** (laid loosely over the burn, not wrapped around a limb) or a clean, non-fluffy dressing
5. Keep the casualty **warm** — cooling a large burn can cause hypothermia

### Do NOT
- Apply butter, toothpaste, or creams
- Use ice or ice-cold water
- Pop blisters
- Remove anything stuck to the burn
- Use fluffy or adhesive dressings

## Fractures & Sprains

### Recognising a Fracture
- **Pain** at the injury site
- **Swelling** and bruising
- **Deformity** — the limb looks an unusual shape
- Difficulty or inability to **move** the affected area
- A grating or **crunching** sensation

### Treatment
1. Tell the casualty to **keep still** — do not attempt to straighten the limb
2. Support the injury — use your hands, padding, or rolled-up clothing
3. Apply a **cold pack** (wrapped in cloth) to reduce swelling
4. Call **999** if you suspect a fracture to the hip, pelvis, or spine, or if the casualty cannot walk
5. For less serious injuries, help them get to A&E

## Anaphylaxis

### What is Anaphylaxis?
A severe, life-threatening allergic reaction. Common triggers include:
- Nuts, shellfish, eggs, milk
- Bee and wasp stings
- Certain medications (e.g., penicillin)
- Latex

### Signs & Symptoms
- Difficulty breathing, wheeze, persistent cough
- Swelling of the face, lips, tongue, or throat
- Widespread red, itchy rash (hives)
- Feeling faint or dizzy
- Abdominal pain, nausea, vomiting
- Collapse and unconsciousness

### Treatment
1. Call **999** immediately — say "anaphylaxis"
2. If the casualty has an **auto-injector (EpiPen)**, help them use it:
   - Remove the safety cap
   - Hold the orange tip against the **outer thigh** (can be through clothing)
   - Press firmly until you hear a click
   - Hold in place for **10 seconds**
   - Massage the injection site
3. Help the casualty into a comfortable position:
   - If breathing is difficult → sit them **upright**
   - If feeling faint → lay them down with legs raised
4. A **second dose** can be given after 5–15 minutes if symptoms don't improve
5. If they become unresponsive and stop breathing → start **CPR**

> **Key Point:** In a care setting, always check service users' care plans for known allergies. Know where any prescribed auto-injectors are kept and ensure they are in date.`
        }
      ]
    }
  ]
};

// ─── COURSE 2: Safeguarding Adults in Social Care ────────────────────────────

const SAFEGUARDING_COURSE = {
  title: 'Safeguarding Adults in Social Care',
  description: 'A comprehensive safeguarding course based on the Care Act 2014 and aligned with Skills for Care standards. Covers types of abuse, recognising the signs, Mental Capacity Act 2005, reporting procedures, and professional practice. Essential training for all care workers in England.',
  category: 'mandatory',
  difficulty_level: 'Beginner',
  duration_minutes: 150,
  passing_score: 80,
  expiry_days: 365,
  modules: [
    {
      title: 'Module 1: Introduction to Safeguarding',
      description: 'What safeguarding means, the legal framework, and the six key principles.',
      order_index: 0,
      lessons: [
        {
          title: 'What is Safeguarding?',
          description: 'Understanding safeguarding and why it matters in adult social care.',
          order_index: 0,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/Mjo7Kz_4cfk',
          content: `# What is Safeguarding?

## Definition
Safeguarding means **protecting an adult's right to live in safety, free from abuse and neglect**. It is about people and organisations working together to prevent and stop both the risks and experience of abuse or neglect.

## Who Needs Safeguarding?
The Care Act 2014 defines an **"adult at risk"** as someone who:
- Is **aged 18 or over**
- Has **needs for care and support** (whether or not those needs are being met)
- Is experiencing, or is at risk of, **abuse or neglect**
- As a result of their care and support needs, is **unable to protect themselves**

## Why Safeguarding Matters
- Adults receiving care are often in **vulnerable situations** — they may depend on others for their basic needs
- They may be **unable to speak up** for themselves due to illness, disability, or fear
- **Abuse can happen anywhere** — in care homes, in people's own homes, in hospitals, or in the community
- As a care worker, you have a **duty to act** if you suspect abuse or neglect

## Safeguarding is Everyone's Responsibility
Safeguarding is not just the job of social workers or the police. **Every person** who works with adults at risk has a responsibility to:
- Be **alert** to the signs of abuse and neglect
- **Report** any concerns promptly
- Follow their organisation's **safeguarding policies and procedures**
- **Put the adult at the centre** — listen to them and respect their wishes

## Making Safeguarding Personal
This is a key approach in England. It means:
- Safeguarding should be **person-centred** — what does the adult want to happen?
- The adult should be **involved** in decisions about their safety
- The focus should be on **outcomes** — what would make the person feel safer?
- Professionals should work **with** people, not **do things to** them

> **Remember:** Safeguarding is not about wrapping people in cotton wool. It is about respecting their rights while keeping them safe from harm. Everyone deserves to live free from abuse.`
        },
        {
          title: 'The Care Act 2014 & Section 42',
          description: 'The legal framework for safeguarding adults in England.',
          order_index: 1,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/l-yeoMMKIto',
          content: `# The Care Act 2014

## Overview
The Care Act 2014 is the most significant piece of legislation for adult social care in England. It brought together and modernised the framework of care and support law. Chapter 14 specifically deals with **safeguarding adults**.

## Key Requirements of the Care Act 2014

### Local Authority Duties
Each local authority must:
- Make **enquiries** (or cause others to make enquiries) where it suspects an adult is at risk of abuse or neglect — this is known as a **Section 42 enquiry**
- Establish a **Safeguarding Adults Board (SAB)** with the local authority, NHS, and police as core members
- Arrange **Safeguarding Adults Reviews (SARs)** when someone dies or is seriously harmed as a result of abuse or neglect
- Ensure that adults at risk are **involved** in safeguarding processes

### Section 42 Enquiry
A Section 42 enquiry is triggered when a local authority has **reasonable cause to suspect** that:
1. An adult has needs for care and support
2. The adult is experiencing, or at risk of, abuse or neglect
3. The adult is unable to protect themselves because of their care and support needs

The local authority must make (or cause to be made) whatever enquiries it thinks necessary to decide:
- Whether any action should be taken
- If so, what action and by whom

### The Wellbeing Principle
The Care Act places **individual wellbeing** at the heart of everything. This includes:
- Personal dignity (including respectful treatment)
- Physical and mental health and emotional wellbeing
- Protection from abuse and neglect
- Control by the individual over day-to-day life
- Participation in work, education, or recreation
- Social and economic wellbeing
- Domestic, family, and personal relationships
- Suitability of living accommodation

## Integration with Other Legislation
The Care Act works alongside:
- **Mental Capacity Act 2005** — ensuring capacity is assessed when making safeguarding decisions
- **Human Rights Act 1998** — right to life, freedom from degrading treatment, right to liberty
- **Equality Act 2010** — protection from discrimination
- **Modern Slavery Act 2015** — identifying and supporting victims of trafficking

> **Key Point:** The Care Act 2014 puts the person at the centre of safeguarding. Your role is to ensure that adults at risk receive the protection they need while respecting their autonomy and wishes.`
        },
        {
          title: 'The Six Safeguarding Principles',
          description: 'The six principles that underpin all safeguarding work in England.',
          order_index: 2,
          content_type: 'text',
          content: `# The Six Safeguarding Principles

## Overview
The Care Act 2014 sets out **six key principles** that should underpin all safeguarding work. These principles apply to all sectors and settings, and should guide your practice every day.

## The Principles

### 1. Empowerment
*"I am asked what I want as the outcomes from the safeguarding process and these directly inform what happens."*

- **Person-led decisions** and informed consent
- Support the adult to make their own choices
- Provide information and support so they can make informed decisions
- Presume capacity unless assessed otherwise

### 2. Prevention
*"I receive clear and simple information about what abuse is, how to recognise the signs and what I can do to seek help."*

- It is better to take action **before harm occurs**
- Risk assessment and risk management
- Training and awareness
- Creating cultures that don't tolerate abuse

### 3. Proportionality
*"I am sure that the professionals will work in my interest, as I see them, and they will only get involved as much as needed."*

- The **least intrusive** response appropriate to the risk presented
- Not all safeguarding concerns require a formal enquiry
- The response should be **proportionate** to the level of risk
- Avoid over-reaction as well as under-reaction

### 4. Protection
*"I get help and support to report abuse and neglect. I get help so that I am able to take part in the safeguarding process to the extent to which I want."*

- Support and representation for those in **greatest need**
- Advocacy services for those who have difficulty being heard
- Access to justice and redress
- Effective investigation and prosecution where appropriate

### 5. Partnership
*"I know that staff treat any personal and sensitive information in confidence, only sharing what is helpful and necessary. I am confident that professionals will work together and with me to get the best result for me."*

- Local solutions through services working **together**
- Multi-agency collaboration (local authority, NHS, police, voluntary sector)
- Information sharing (with consent where possible)
- Community engagement

### 6. Accountability
*"I understand the role of everyone involved in my life and so do they."*

- **Accountability and transparency** in safeguarding practice
- Clear governance structures
- Learning from mistakes through Safeguarding Adults Reviews
- Supervision and support for staff

## Applying the Principles in Practice
As a care worker, you can apply these principles by:
- **Asking** the adult what they want to happen (Empowerment)
- **Reporting** concerns early, before harm escalates (Prevention)
- **Responding** in a way that is appropriate to the situation (Proportionality)
- **Supporting** the adult through the process (Protection)
- **Working with** other professionals and agencies (Partnership)
- **Following** your organisation's policies and keeping clear records (Accountability)

> **Remember:** These six principles are not just theory — they should guide every interaction you have with the adults you support.`
        }
      ]
    },
    {
      title: 'Module 2: Types of Abuse & Neglect',
      description: 'Learn to identify the different categories of abuse and neglect as defined in the Care Act 2014.',
      order_index: 1,
      lessons: [
        {
          title: 'Physical, Emotional & Sexual Abuse',
          description: 'Understanding physical abuse, emotional/psychological abuse, and sexual abuse.',
          order_index: 0,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/JS33VJcaxjQ',
          content: `# Physical, Emotional & Sexual Abuse

## Physical Abuse
Physical abuse is the **deliberate use of physical force** that results in pain, injury, or impairment. It includes:

- Hitting, slapping, pushing, kicking, or shaking
- Misuse of medication (over-medicating, withholding medication)
- **Restraint** — inappropriate physical restraint or being locked in a room
- Force-feeding or withholding food
- Inappropriate use of sanctions or punishments

### Signs to Look For
- Unexplained bruises, burns, or fractures (especially in unusual patterns or at different stages of healing)
- Finger or grip marks
- Injuries that are inconsistent with the explanation given
- The person flinches or cowers when approached
- Over-use of medication or sedation

## Emotional / Psychological Abuse
Emotional abuse is behaviour that has a **harmful effect on a person's emotional health and development**. It includes:

- Threats, intimidation, or coercion
- Verbal abuse, humiliation, or name-calling
- Bullying, harassment, or blaming
- Controlling behaviour or isolation from friends and family
- Denial of basic human rights (e.g., privacy, choice, dignity)
- Treating an adult like a child (infantilisation)

### Signs to Look For
- Withdrawn, anxious, or fearful behaviour
- Changes in mood or behaviour, especially around certain individuals
- Low self-esteem or self-blame
- Sleep disturbance or loss of appetite
- Reluctance to speak openly or "shutting down"
- The person appears nervous or scared of their carer

## Sexual Abuse
Sexual abuse is any **sexual act that a person has not consented to** or could not consent to due to lack of capacity. It includes:

- Rape, sexual assault, or sexual acts without consent
- Inappropriate touching
- Sexual harassment or unwanted sexual comments
- Being made to watch sexual acts or pornography
- Taking, sharing, or displaying indecent images without consent

### Signs to Look For
- Unexplained bruising or injuries to the genital area
- Torn, stained, or bloody underclothing
- Sexually transmitted infections
- Unusual difficulty walking or sitting
- Sudden changes in behaviour or personality
- Fear of being alone with a particular person
- The person becoming withdrawn or secretive

## Important Notes
- **Consent** is key — a person must have the capacity to consent and must give consent freely
- Abuse can be carried out by **anyone** — family members, care workers, other service users, strangers
- Abuse can be a **single act or ongoing** pattern of behaviour
- The **severity** of the impact is determined by the victim, not the perpetrator

> **Remember:** If you see any of these signs, do not ignore them. Report your concerns to your manager and follow your organisation's safeguarding procedures. Trust your instincts — if something doesn't feel right, it probably isn't.`
        },
        {
          title: 'Financial Abuse, Neglect & Modern Slavery',
          description: 'Understanding financial exploitation, neglect, self-neglect, and modern slavery.',
          order_index: 1,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/_Ki7XsezOWw',
          content: `# Financial Abuse, Neglect & Modern Slavery

## Financial or Material Abuse
Financial abuse is the **unauthorised or improper use** of a person's money, property, or resources. It includes:

- Theft of money or possessions
- Fraud or scamming
- Coercion in relation to **wills, property, or finances**
- Misuse or misappropriation of benefits or allowances
- Exploitation by a person in a position of trust (e.g., carer, family member)
- Being pressured into financial decisions
- Rogue traders or doorstep crime

### Signs to Look For
- Unexplained withdrawals or transactions from bank accounts
- Missing money, possessions, or valuables
- Sudden changes to a will or financial documents
- Unpaid bills despite having adequate income
- The person seems anxious about money or reluctant to discuss finances
- A new "friend" or acquaintance who seems overly interested in the person's money
- The person is not receiving the care they are paying for

## Neglect and Acts of Omission
Neglect is the **failure to provide adequate care and support**. It can be deliberate or unintentional. It includes:

- Failure to provide food, drink, heating, or clothing
- Failure to provide access to healthcare or medication
- Ignoring care needs or failing to follow care plans
- Failure to ensure **personal hygiene** (unwashed, unchanged continence pads)
- Isolating the person or leaving them unattended for long periods
- Failure to provide appropriate supervision

### Self-Neglect
Self-neglect is when a person **fails to care for their own basic needs**. It may involve:
- Not eating or drinking adequately
- Not maintaining personal hygiene
- Hoarding
- Not seeking medical help when needed
- Living in unsanitary conditions

Self-neglect is included in safeguarding under the Care Act 2014 because it can indicate **underlying issues** such as mental illness, substance misuse, or coercion by others.

## Modern Slavery & Domestic Abuse

### Modern Slavery
Modern slavery includes:
- **Human trafficking** — being transported for the purpose of exploitation
- **Forced labour** — being made to work against your will
- **Domestic servitude** — being forced to work in a household
- **Sexual exploitation**

Signs include: a person seems fearful, is not free to leave, has no identity documents, appears malnourished, or is controlled by another person.

### Domestic Abuse
Domestic abuse is any incident of **controlling, coercive, threatening behaviour**, violence, or abuse between people who are, or have been, intimate partners or family members. Since 2015, **coercive control** is a criminal offence in England and Wales.

## Discriminatory Abuse
Abuse based on a person's **protected characteristics** under the Equality Act 2010:
- Age, disability, gender reassignment
- Marriage/civil partnership, pregnancy/maternity
- Race, religion or belief, sex, sexual orientation

This includes hate crime, harassment, and denial of services or access.

## Organisational Abuse
Also called **institutional abuse**, this occurs when the routines, practices, or culture of an organisation result in abuse or neglect. Examples:
- Rigid or inflexible routines that ignore individual needs
- Staff shortages leading to inadequate care
- A culture of bullying or poor practice
- Lack of training or supervision

> **Key Point:** Abuse can take many forms and is often hidden. Being aware of all these categories helps you spot the signs and take action to protect the people in your care.`
        }
      ]
    },
    {
      title: 'Module 3: Recognising the Signs',
      description: 'How to identify physical, behavioural, and environmental indicators of abuse or neglect.',
      order_index: 2,
      lessons: [
        {
          title: 'Physical & Behavioural Indicators',
          description: 'Detailed guidance on recognising the signs of abuse in adults you support.',
          order_index: 0,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/8TTb_Zp43l4',
          content: `# Recognising the Signs of Abuse

## Why Recognition Matters
As a care worker, you see the adults you support regularly — often daily. This puts you in a **unique position** to notice changes that might indicate abuse or neglect. Early recognition leads to early intervention.

## Physical Indicators

### Bruises & Marks
- Bruises on areas **not typically injured** in everyday life (inner arms, thighs, back, face)
- Bruises in a **pattern** (grip marks, belt marks, ligature marks)
- Bruises at **different stages** of healing (suggesting repeated injury)
- Burns in unusual patterns (cigarette burns, iron marks, scald lines)

### Physical Condition
- **Unexplained weight loss** or malnutrition
- Dehydration (dry mouth, sunken eyes, dark urine)
- Poor personal hygiene (unchanged clothing, body odour, matted hair)
- Untreated medical conditions or pressure sores
- Over-sedation or under-medication
- Missing dentures, glasses, or hearing aids

### Sexual Abuse Indicators
- Genital or anal bruising or bleeding
- Torn or stained underclothing
- Sexually transmitted infections
- Urinary tract infections (if recurring or unexplained)

## Behavioural Indicators

### Changes in Behaviour
- Becoming **withdrawn, quiet, or uncommunicative**
- Becoming **agitated, aggressive, or anxious** — especially around certain people
- Sleep disturbance, nightmares
- Loss of appetite or overeating
- Increased confusion or disorientation (beyond what their condition would explain)
- **Rocking**, head-banging, or self-harm
- Fear of being alone or fear of a specific person

### Emotional Responses
- Tearfulness, despair, or expressions of hopelessness
- Reluctance to undress or be examined
- Expressing fear of going home or being left with a particular person
- Making disclosures then **retracting** them
- Low self-esteem, self-blame, or expressions of worthlessness

### Financial Indicators
- Sudden inability to pay for things they could previously afford
- Anxiety about money or bills
- Missing belongings or money
- Changes to legal documents (wills, power of attorney)
- New people appearing in their life with financial interests

## Environmental Indicators
- Living in squalor or unsafe conditions
- Inadequate heating, lighting, or food
- Locked in a room or unable to access parts of their home
- Evidence of hoarding
- Medication stored incorrectly or in unusual quantities

## Trust Your Instincts
You don't need **proof** of abuse to raise a concern. If something feels wrong, it probably is. Key phrases to listen for:
- *"I don't want to be any trouble"*
- *"Please don't tell anyone"*
- *"It's nothing, I deserved it"*
- *"They didn't mean to hurt me"*

> **Key Point:** One sign on its own may not indicate abuse, but a **pattern of signs** should raise serious concern. Always record what you see and hear, and report it promptly.`
        },
        {
          title: 'What to Do When Someone Discloses',
          description: 'How to respond when an adult tells you they are being abused.',
          order_index: 1,
          content_type: 'text',
          content: `# Responding to a Disclosure

## When Someone Tells You
If an adult tells you they are being abused or you suspect abuse, how you respond is **critical**. Your reaction can determine whether they feel safe enough to seek help.

## The DO's

### Listen
- **Listen calmly** and patiently
- Give the person your **full attention**
- Let them tell their story **in their own words** and at their own pace
- Use **open questions** if needed: "Can you tell me more about that?"
- Show you believe them: *"I'm glad you told me"*

### Reassure
- Tell them it's **not their fault**
- Say: *"You've done the right thing by telling me"*
- Reassure them that you will take their concerns seriously
- Explain what you will do next (report to your manager / safeguarding lead)

### Record
- Write down what they said as soon as possible — **using their own words**
- Include the **date, time, and location** of the disclosure
- Record any **visible injuries** (but do not photograph them without consent)
- Note who was present
- Keep your notes **factual** — record what was said, not your opinion
- Sign and date your record

### Report
- Report immediately to your **line manager or safeguarding lead**
- If your manager is the alleged abuser, go to **their manager** or your safeguarding lead
- If a crime has been or is being committed, call the **police (999)**
- Follow your organisation's **safeguarding policy**
- Do not attempt to investigate yourself

## The DON'Ts

| Don't... | Why |
|----------|-----|
| Don't promise to keep it a secret | You have a legal duty to report safeguarding concerns |
| Don't investigate or ask leading questions | This is the role of trained investigators — your questions could contaminate evidence |
| Don't confront the alleged abuser | This could put the adult at greater risk and compromise any investigation |
| Don't make judgements | It's not your role to decide if abuse has occurred |
| Don't delay | Report immediately — delays can put the adult at further risk |
| Don't discuss with colleagues (except your manager) | Confidentiality is essential to protect the adult |

## What to Say vs. What NOT to Say

### Say:
- *"I believe you"*
- *"This is not your fault"*
- *"You're doing the right thing by telling me"*
- *"I need to share this with my manager so we can help you"*

### Don't Say:
- *"Why didn't you say something sooner?"*
- *"Are you sure that happened?"*
- *"That doesn't sound like something they would do"*
- *"I'll sort this out myself"*

> **Key Point:** Your role is to **listen, reassure, record, and report**. You are not an investigator. By reporting, you are ensuring the adult gets the help and protection they need.`
        },
        {
          title: 'Case Studies',
          description: 'Real-world scenarios to help you recognise and respond to abuse.',
          order_index: 2,
          content_type: 'text',
          content: `# Case Studies — Recognising & Responding to Abuse

## Case Study 1: Financial Abuse

### Scenario
You visit Mrs Ahmed, aged 82, who lives alone. Over the past few weeks you've noticed:
- Her heating is off, even though it's winter
- She says she "can't afford" to have the heating on
- Her nephew has started visiting more frequently
- She mentions her nephew is "helping" her with banking
- A new large TV has appeared in her nephew's flat (which you also visit)

### What Should You Do?
1. **Talk to Mrs Ahmed** — gently ask how she's managing with money. Don't accuse anyone.
2. **Record your observations** — the pattern of changes, what she's said, the cold house
3. **Report to your manager** immediately
4. The manager should consider whether to make a **safeguarding referral** to the local authority

### Why This Matters
Financial abuse of older adults is extremely common and often carried out by **family members** in positions of trust.

---

## Case Study 2: Neglect

### Scenario
You arrive at Mr Davies' home for your morning call. He has dementia and requires support with personal care. You notice:
- He is still in yesterday's clothes
- There are faeces on the bedsheets
- The night care worker (from another agency) has recorded "all care given" in the care notes
- He is dehydrated and seems distressed
- This is the third time this has happened in two weeks

### What Should You Do?
1. **Provide immediate care** — help Mr Davies wash, change, and have a drink
2. **Record exactly what you found** — be factual and specific
3. **Report to your manager** immediately — this is a pattern of neglect
4. Your manager should consider a **safeguarding referral** and notify the other agency

### Why This Matters
Falsifying care records while leaving a vulnerable person without care is a serious form of **neglect** and potentially a criminal offence.

---

## Case Study 3: Emotional Abuse

### Scenario
You visit Mrs Chen, aged 74, who lives with her adult daughter. You notice:
- Mrs Chen seems anxious and rarely speaks when her daughter is present
- The daughter speaks to her mother in a harsh, dismissive tone
- Mrs Chen flinches when her daughter raises her voice
- The daughter says: "Mum's fine, she's just attention-seeking"
- When alone with you, Mrs Chen whispers: "She gets so angry with me. I'm frightened."

### What Should You Do?
1. **Listen** to Mrs Chen without judgement
2. **Reassure** her: "Thank you for telling me. I take this seriously."
3. **Record** her exact words and your observations
4. **Report** to your manager or safeguarding lead immediately
5. Consider Mrs Chen's **safety** — is she at immediate risk?

### Why This Matters
Emotional abuse by family carers is one of the **hardest forms of abuse to recognise** because it often happens behind closed doors. Your regular visits give you vital insight.

---

## Reflection Questions
After reading these case studies, consider:
- Could any of these situations apply to the people you support?
- Do you know your organisation's safeguarding reporting procedure?
- Do you know who your designated safeguarding lead is?
- Are you confident you would recognise these signs?

> **Key Point:** These case studies are based on common real-world scenarios. Abuse is rarely dramatic or obvious — it often develops gradually. Stay alert, trust your instincts, and always report your concerns.`
        }
      ]
    },
    {
      title: 'Module 4: Mental Capacity & Consent',
      description: 'Understand the Mental Capacity Act 2005 and how it relates to safeguarding decisions.',
      order_index: 3,
      lessons: [
        {
          title: 'The Mental Capacity Act 2005',
          description: 'The five principles and two-stage test of the Mental Capacity Act.',
          order_index: 0,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/z37_IcDkXWg',
          content: `# The Mental Capacity Act 2005

## Overview
The Mental Capacity Act (MCA) 2005 provides a legal framework for making decisions on behalf of adults who **lack the capacity** to make specific decisions for themselves. It is fundamental to safeguarding.

## The Five Principles

### Principle 1: Presumption of Capacity
*"A person must be assumed to have capacity unless it is established that they lack capacity."*
- Start from the position that the person CAN make their own decisions
- Never assume someone lacks capacity based on their **age, appearance, condition, or behaviour**

### Principle 2: Supported Decision-Making
*"A person is not to be treated as unable to make a decision unless all practicable steps to help them do so have been taken without success."*
- Before concluding someone lacks capacity, you must **try to help them** make the decision
- Use simple language, pictures, or other communication aids
- Choose the best time and place for the conversation
- Involve people the person trusts

### Principle 3: Unwise Decisions
*"A person is not to be treated as unable to make a decision merely because they make an unwise decision."*
- People have the **right to make decisions** that others might disagree with
- Making an "unwise" or "risky" choice does NOT mean they lack capacity
- Capacity is about the **process** of decision-making, not the outcome

### Principle 4: Best Interests
*"An act done, or decision made, for or on behalf of a person who lacks capacity must be done in their best interests."*
- If someone lacks capacity, any decision made for them must be in their **best interests**
- This involves consulting with them, their family, and relevant professionals

### Principle 5: Least Restrictive Option
*"Before the act is done, or the decision is made, regard must be had to whether the purpose can be as effectively achieved in a way that is less restrictive of the person's rights and freedom of action."*
- Always choose the option that **restricts the person's rights and freedoms the least**

## The Two-Stage Capacity Test

### Stage 1: Diagnostic Test
Is there an impairment of, or disturbance in, the functioning of the person's mind or brain?
- Examples: dementia, learning disability, brain injury, mental illness, intoxication, delirium

### Stage 2: Functional Test
Is the person unable to:
1. **Understand** the information relevant to the decision?
2. **Retain** the information long enough to make the decision?
3. **Use or weigh** the information as part of the decision-making process?
4. **Communicate** the decision (by any means)?

If the person fails **any one** of these four elements, they lack capacity for that specific decision at that specific time.

## Key Points
- Capacity is **decision-specific** — a person may lack capacity for one decision but have capacity for another
- Capacity is **time-specific** — a person's capacity may fluctuate
- Capacity assessments should be **recorded** and kept on file

> **Remember:** The MCA protects both the person who lacks capacity AND the professionals who make decisions on their behalf. Always follow the five principles.`
        },
        {
          title: 'Best Interests & DoLS',
          description: 'Making best interests decisions and understanding Deprivation of Liberty Safeguards.',
          order_index: 1,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/VEn9RvqhqZg',
          content: `# Best Interests Decisions & Deprivation of Liberty Safeguards

## Making Best Interests Decisions
When a person has been assessed as **lacking capacity** for a specific decision, any decision made on their behalf must be in their **best interests**.

### The Best Interests Checklist
Consider:
1. **All relevant circumstances** — not just medical factors
2. Whether the person might **regain capacity** — can the decision wait?
3. The person's **past and present wishes, feelings, beliefs, and values**
4. The views of:
   - Anyone the person has asked to be consulted
   - Family members, friends, and carers
   - Any appointed **attorney** (under a Lasting Power of Attorney)
   - Any appointed **deputy** (appointed by the Court of Protection)
5. **Encourage participation** — involve the person as much as possible

### Who Can Make Best Interests Decisions?
- For **day-to-day care decisions**: the care worker providing care (e.g., helping someone eat, get dressed)
- For **significant decisions**: a formal best interests meeting may be needed (involving healthcare professionals, social workers, family)
- For **serious medical treatment or accommodation**: may involve the Court of Protection

## Deprivation of Liberty Safeguards (DoLS)

### What is a Deprivation of Liberty?
A person is being deprived of their liberty if they are:
- Under **continuous supervision and control** AND
- **Not free to leave** AND
- They **lack the capacity** to consent to their care arrangements

### The "Acid Test" (Supreme Court 2014)
Following the **Cheshire West** case, the Supreme Court established the "acid test":
1. Is the person **subject to continuous supervision and control?**
2. Is the person **free to leave?** (The question is whether they COULD leave, not whether they WANT to leave)

If the answer is YES to question 1 and NO to question 2, and the person lacks capacity, this is likely a deprivation of liberty.

### How DoLS Works
1. The care home or hospital (**managing authority**) identifies that a person may be being deprived of their liberty
2. They apply to the **local authority (supervisory body)** for a DoLS authorisation
3. The local authority arranges **assessments** (six in total):
   - Age assessment, mental health assessment, mental capacity assessment
   - Best interests assessment, eligibility assessment, no refusals assessment
4. If authorised, the deprivation of liberty can continue for up to **12 months**
5. The person must have a **relevant person's representative** to protect their interests
6. The person (or their representative) can challenge the authorisation through the Court of Protection

### Liberty Protection Safeguards (LPS)
The LPS was intended to replace DoLS but has been **repeatedly delayed**. As of 2024, DoLS remains in force.

## Applying This to Safeguarding
- If a person **lacks capacity** to make decisions about their safety, a best interests decision may be needed
- The person should still be **involved** as much as possible (Making Safeguarding Personal)
- Any restrictions placed on a person for their safety must be **proportionate** and **the least restrictive option**
- Consider whether DoLS applies if the safety measures involve restricting the person's liberty

> **Key Point:** The Mental Capacity Act and DoLS exist to protect the rights of people who cannot make certain decisions for themselves. Always follow the five principles and the least restrictive approach.`
        },
        {
          title: 'Making Safeguarding Personal',
          description: 'Putting the adult at the centre of safeguarding decisions.',
          order_index: 2,
          content_type: 'text',
          content: `# Making Safeguarding Personal

## What is Making Safeguarding Personal?
Making Safeguarding Personal (MSP) is a shift in safeguarding practice from a process-driven approach to an **outcome-focused, person-centred** approach. It was developed by the Local Government Association and the Association of Directors of Adult Social Services (ADASS).

## Core Principles
1. **Ask the person what they want** — what outcomes are they seeking?
2. **Involve the person** throughout the safeguarding process
3. **Respect their wishes** — even if you disagree (provided they have capacity)
4. **Focus on outcomes** — did the person achieve what they wanted?
5. **Record outcomes** — measure success based on what the person wanted

## In Practice

### Before Making a Referral
Ask the person:
- *"What would you like to happen?"*
- *"How can we help you feel safer?"*
- *"What is most important to you?"*
- *"Is there anything you're worried about?"*

### During the Process
- Keep the person **informed** about what is happening
- **Check in** regularly — have their wishes changed?
- Provide access to **advocacy** if they need help being heard
- Respect their right to **decline** a safeguarding enquiry (if they have capacity)

### What if the Person Doesn't Want Action?
If an adult with capacity says they don't want a safeguarding referral, you should:
1. **Respect their decision** — but explain your duty to share information with your manager
2. **Assess the risk** — are others at risk? (e.g., other service users, children)
3. **Record the decision** and the reasons
4. If there is a risk to **others**, you may still need to report — you cannot keep this confidential
5. If a **criminal offence** has been committed, the police may act regardless of the person's wishes

### When You Must Override Wishes
There are circumstances where you must act **even if the person does not want you to**:
- There is a risk to **other people** (other service users, children)
- A **serious criminal offence** has been committed
- The person **lacks capacity** to make the decision about their safety
- There is a **public interest** concern (e.g., a care worker abusing multiple people)

## Measuring Success
MSP measures success by asking:
- Was the person **asked** what outcomes they wanted?
- Were those outcomes **achieved** (fully or partially)?
- Does the person **feel safer** as a result of the safeguarding process?

Research shows that when adults are involved in safeguarding decisions, they are **more likely to feel safer** and more satisfied with the outcome.

> **Key Point:** Safeguarding should be done WITH people, not TO them. Always start by asking what the person wants, and keep checking in throughout the process.`
        }
      ]
    },
    {
      title: 'Module 5: Reporting & Responding',
      description: 'Your duty to report, whistleblowing protections, and the safeguarding referral process.',
      order_index: 4,
      lessons: [
        {
          title: 'Duty to Report & Whistleblowing',
          description: 'Understanding your obligation to report and your legal protection as a whistleblower.',
          order_index: 0,
          content_type: 'text',
          video_url: 'https://www.youtube.com/embed/oKtGgH7-eR0',
          content: `# Duty to Report & Whistleblowing

## Your Duty to Report
As a care worker, you have a **professional and legal duty** to report any concerns about abuse or neglect. This is not optional.

### When to Report
Report if you:
- **Witness** abuse or neglect
- **Suspect** abuse or neglect (you don't need proof)
- **Are told** by an adult that they are being abused (a disclosure)
- **Notice changes** that suggest abuse may be occurring
- Have concerns about the **practices of a colleague** or the organisation

### Who to Report To
1. **Your line manager** — this is usually the first step
2. **The designated safeguarding lead** in your organisation
3. If your manager IS the concern: go to **their manager** or the safeguarding lead
4. If you cannot report internally: contact the **local authority safeguarding team** directly
5. In an **emergency**: call **999**

### What Happens When You Report
1. Your manager/safeguarding lead will assess the concern
2. They may make a **safeguarding referral** to the local authority
3. The local authority will decide whether a **Section 42 enquiry** is needed
4. You may be asked to provide a **statement** or attend a meeting
5. You will be kept informed of the outcome (within appropriate boundaries)

## Whistleblowing

### What is Whistleblowing?
Whistleblowing is when a worker raises a concern about wrongdoing within their organisation. The **Public Interest Disclosure Act 1998** protects whistleblowers from:
- Dismissal
- Victimisation
- Being treated unfairly or suffering a detriment

### When to Whistleblow
Consider whistleblowing if:
- Your concerns have been reported internally but **no action has been taken**
- You believe the organisation is **covering up** abuse
- You believe reporting internally would be **pointless or dangerous**
- The concern is about **senior management** or the organisation itself

### Where to Whistleblow
- **CQC (Care Quality Commission)** — the regulator for health and social care in England. Call: 03000 616161
- **Local authority safeguarding team**
- **The police** — if a crime is involved
- **A solicitor** — for legal advice
- **Public Concern at Work** (now called **Protect**) — a charity that provides free, confidential advice to whistleblowers: 020 3117 2520

### Your Protection
Under the Public Interest Disclosure Act 1998:
- You are protected from **dismissal** if you make a qualifying disclosure
- You are protected from being subjected to any **detriment** by your employer
- Your disclosure must be made **in good faith** and **in the public interest**
- You do NOT need to have proof — a **reasonable belief** is sufficient

### Common Fears About Whistleblowing
- *"I might be wrong"* — You are protected even if you turn out to be wrong, as long as you had a reasonable belief
- *"I'll lose my job"* — The law protects you from dismissal
- *"Nothing will change"* — Regulators take whistleblowing seriously; many safeguarding failures have been uncovered by whistleblowers
- *"My colleagues will hate me"* — Your identity can be protected where possible

> **Key Point:** Speaking up about abuse or poor practice is not being disloyal — it is the most important thing you can do as a care worker. Silence allows abuse to continue. You are legally protected when you raise concerns.`
        },
        {
          title: 'The Safeguarding Referral Process',
          description: 'How safeguarding referrals work and what to expect.',
          order_index: 1,
          content_type: 'text',
          content: `# The Safeguarding Referral Process

## Step-by-Step Process

### Step 1: Raise the Concern
- Report your concern to your **manager or safeguarding lead**
- Complete a **safeguarding concern form** (your organisation will have one)
- Include: who, what, when, where, and any exact words used by the adult
- Keep your records **factual and objective**

### Step 2: The Decision to Refer
Your manager/safeguarding lead will:
- Assess whether the concern meets the **Section 42 criteria**
- Consider whether the adult is at **immediate risk** and needs emergency action
- Decide whether to make a **safeguarding referral** to the local authority

### Step 3: The Safeguarding Referral
The referral is made to the local authority's **Adult Social Care team** or safeguarding hub. The referral should include:
- Details of the **adult at risk** (name, DOB, address, care needs)
- Details of the **concern** (type of abuse, when it happened, who is involved)
- The **adult's views** (what do they want to happen?)
- Any **immediate risks** and actions already taken
- Whether the adult has **capacity** to make decisions about their safety

### Step 4: The Local Authority Response
The local authority will:
1. **Acknowledge** the referral (usually within 24 hours)
2. **Screen** the referral — does it meet the Section 42 criteria?
3. If yes, decide on the **type of enquiry** needed
4. Appoint an **enquiry officer** (could be a social worker, nurse, or other professional)
5. Contact the **adult at risk** to discuss their wishes (Making Safeguarding Personal)

### Step 5: The Enquiry
The enquiry may involve:
- Speaking to the adult at risk, their family, and relevant professionals
- Reviewing care records and incident reports
- Liaison with the police (if criminal activity is suspected)
- A **strategy meeting** or **safeguarding meeting** involving relevant agencies
- Medical examination (with consent)

### Step 6: The Outcome
Possible outcomes include:
- **No further action** — the concern is not substantiated
- **Protection plan** — measures put in place to protect the adult
- **Referral to police** — for criminal investigation
- **Referral to other agencies** — e.g., advocacy, counselling, housing
- **Organisational action** — e.g., improvement plan for a care provider
- **Disciplinary action** — against a member of staff
- **CQC notification** — the regulator is informed

### Step 7: Review and Closure
- The case is reviewed to ensure the **protection plan is working**
- The adult is asked whether they feel **safer**
- The case is closed when the risk has been managed and the adult's outcomes have been achieved (or as far as possible)

## Timescales
- Urgent concerns: response within **24 hours** or immediately
- Non-urgent concerns: acknowledged within **1 working day**, initial assessment within **5 working days**
- Enquiry: no fixed timescale, but should be completed as quickly as possible

## Your Role Throughout
- **Cooperate** with the enquiry
- **Provide information** when asked
- **Continue to support** the adult
- **Maintain confidentiality** — only share information on a "need to know" basis
- **Record** everything accurately

> **Key Point:** The safeguarding referral process exists to protect adults at risk. Your role is to report concerns — the local authority will handle the investigation. You don't need to have all the answers before making a referral.`
        },
        {
          title: 'Working with the Local Authority',
          description: 'Understanding multi-agency working and your responsibilities during an enquiry.',
          order_index: 2,
          content_type: 'text',
          content: `# Working with the Local Authority

## Multi-Agency Working
Safeguarding is most effective when agencies **work together**. The Care Act 2014 requires co-operation between:
- **Local authorities** — lead on safeguarding
- **NHS** — health professionals, GPs, hospitals, mental health services
- **Police** — criminal investigations
- **Care providers** — care homes, domiciliary care agencies
- **Voluntary sector** — charities, advocacy services
- **Housing** — homelessness teams, housing associations

## The Safeguarding Adults Board (SAB)
Every local authority area has a Safeguarding Adults Board (SAB), which brings together:
- The **local authority** (statutory partner)
- The **NHS Clinical Commissioning Group** (statutory partner)
- The **police** (statutory partner)
- Other agencies as appropriate

The SAB is responsible for:
- Developing and publishing a **strategic plan** for safeguarding
- Publishing an **annual report** on safeguarding activity
- Conducting **Safeguarding Adults Reviews (SARs)** when someone dies or is seriously harmed as a result of abuse or neglect

## Your Responsibilities During an Enquiry

### Be Available
- Respond promptly to requests for information
- Make yourself available for meetings or telephone discussions
- Provide access to care records when requested

### Provide Accurate Information
- Share only **factual information** — what you saw, heard, or were told
- Do not speculate or give opinions unless asked
- Be honest — even if the information is uncomfortable

### Maintain Confidentiality
- Share information on a **"need to know" basis** only
- Do not discuss the case with colleagues who are not involved
- Follow your organisation's **information sharing policy**
- Remember: safeguarding concerns **override** normal confidentiality rules

### Support the Adult
- Continue to provide **good quality care**
- Be alert for any **changes** in the adult's condition or behaviour
- Make sure the adult knows how to contact you if they need support
- Offer to arrange **advocacy** if the adult needs help being heard

### Record Keeping
- Keep **detailed, accurate records** of all interactions related to the concern
- Use the adult's **own words** where possible
- Record **dates, times, and who was present**
- Keep records **secure** and accessible only to authorised staff
- Records should be **contemporaneous** — written as close to the event as possible

## Information Sharing
The **Caldicott Principles** and the **Data Protection Act 2018** guide information sharing:

1. Share information with **consent** where possible
2. Without consent, you may share if:
   - It is in the **vital interests** of the person (life-threatening situation)
   - There is a **safeguarding concern** involving an adult at risk
   - There is a risk to **others**
   - A **court order** requires disclosure
   - There is a **legal duty** to share (e.g., under the Care Act)

**The key principle:** You can share information **without consent** if the risk of NOT sharing outweighs the risk of sharing.

> **Key Point:** Safeguarding is a team effort. Your contribution — however small it may seem — is essential to building the full picture and protecting adults at risk. Always cooperate, be honest, and put the adult at the centre.`
        }
      ]
    },
    {
      title: 'Module 6: Professional Practice',
      description: 'Record keeping, reflective practice, and maintaining high standards in your safeguarding role.',
      order_index: 5,
      lessons: [
        {
          title: 'Record Keeping & Confidentiality',
          description: 'Best practice for safeguarding records and managing confidential information.',
          order_index: 0,
          content_type: 'text',
          content: `# Record Keeping & Confidentiality

## Why Good Records Matter
In safeguarding, your records may be:
- Used as **evidence** in a criminal prosecution
- Reviewed during a **CQC inspection**
- Examined as part of a **Safeguarding Adults Review**
- Used by social workers to **assess risk** and plan interventions
- Relied upon in **court proceedings** (civil or criminal)

Your records could literally be the **difference between justice and injustice** for the person you support.

## Best Practice for Record Keeping

### The Golden Rules
1. **Write records as soon as possible** after the event (ideally within an hour)
2. Use **factual, objective language** — describe what you saw, heard, and did
3. Record the person's **own words** in quotation marks
4. Include **date, time, and your name** on every entry
5. **Sign and date** handwritten records
6. Never use **correction fluid** — draw a single line through errors and initial them
7. Never leave **blank spaces** — draw a line through unused space

### What to Include
- What happened (factual account)
- Who was involved (names, roles)
- When it happened (date, time)
- Where it happened (specific location)
- What the person said (their exact words)
- What you did in response
- Who you reported to and when
- Any visible injuries (described, not photographed without consent)
- The person's emotional state and behaviour

### What NOT to Include
- Your **opinions** (unless specifically asked for a professional opinion)
- **Assumptions** about what happened
- **Judgements** about the person or alleged abuser
- Information that is **not relevant** to the concern
- **Jargon or abbreviations** that others may not understand

## Confidentiality

### The Basics
- All personal and sensitive information must be kept **confidential**
- Share information only on a **"need to know" basis**
- Store records **securely** — locked cabinets for paper records, password-protected for digital
- Follow your organisation's **data protection policy**
- Comply with the **Data Protection Act 2018** and **UK GDPR**

### When Confidentiality Must Be Broken
You **must** break confidentiality when:
- There is a **safeguarding concern** involving an adult at risk or a child
- There is a risk of **serious harm** to the person or others
- A **court order** requires disclosure
- There is a **legal duty** to share information
- The person gives **informed consent** to share

### How to Handle Requests for Information
- If someone asks for confidential information, check their **identity and authority**
- Only share what is **necessary** — don't give more information than needed
- Record **what you shared, with whom, and why**
- If unsure, seek advice from your manager or safeguarding lead

## Digital Records
- Use your organisation's approved recording systems
- Never record safeguarding information on **personal devices**
- Never share confidential information via **personal email, WhatsApp, or social media**
- Log out of systems when you leave your workstation

> **Key Point:** Good record keeping is not just paperwork — it is a fundamental safeguarding skill. Your records protect the adult, support investigations, and could be used as evidence in court. Take them seriously.`
        },
        {
          title: 'Reflective Practice & Continuing Development',
          description: 'Using reflection to improve your safeguarding practice and ongoing learning.',
          order_index: 1,
          content_type: 'text',
          content: `# Reflective Practice & Continuing Development

## What is Reflective Practice?
Reflective practice is the process of **thinking about and learning from** your experiences. In safeguarding, reflection helps you:
- Understand **what you did well** and why
- Identify **what you could do differently** next time
- Process your **emotional response** to difficult situations
- **Develop your skills** and confidence over time

## A Simple Reflective Model

### Driscoll's "What?" Model
1. **What?** — What happened? Describe the situation factually.
2. **So what?** — What did you learn? How did it make you feel? What went well or badly?
3. **Now what?** — What will you do differently next time? What further learning do you need?

### Example Reflection
*"I visited Mrs Green and noticed bruises on her wrists. I asked her about them and she became tearful. I felt worried and wasn't sure what to say. I reported to my manager who made a safeguarding referral.*

*What went well: I noticed the bruises and asked about them. I reported immediately.*

*What could I improve: I froze when she became upset. Next time, I will reassure the person that I believe them and that it's not their fault. I want to attend a workshop on responding to disclosures."*

## Supervision
Regular supervision is essential for safeguarding practice. Use supervision to:
- **Discuss concerns** — even if they seem minor
- **Reflect on practice** — what have you learned from recent events?
- **Seek guidance** — on difficult situations or ethical dilemmas
- **Access support** — dealing with the emotional impact of safeguarding work

## Continuing Professional Development (CPD)
Stay up to date with safeguarding by:
- Attending **refresher training** (at least annually)
- Reading your organisation's **safeguarding policy** (review it every year)
- Following updates from the **Safeguarding Adults Board** in your area
- Reading guidance from **Skills for Care** (skillsforcare.org.uk)
- Attending **team meetings** where safeguarding is discussed
- Learning from **Safeguarding Adults Reviews** published by your local SAB

## Looking After Yourself
Safeguarding work can be **emotionally demanding**. It's important to:
- **Talk to someone** after a difficult experience — your manager, a colleague, or a professional
- Recognise the signs of **stress and burnout**
- Use your organisation's **Employee Assistance Programme** if available
- Take time for **self-care** — rest, exercise, and activities you enjoy
- Know that **it's OK to be affected** — caring about the people you support is a strength, not a weakness

## Key Safeguarding Resources
- **Skills for Care**: skillsforcare.org.uk — training and resources for the adult social care sector
- **Social Care Institute for Excellence (SCIE)**: scie.org.uk — research and good practice guides
- **Ann Craft Trust**: anncrafttrust.org — safeguarding resources and training
- **Local Safeguarding Adults Board** — search "[your area] Safeguarding Adults Board" for local policies and procedures

## Course Summary
In this course, you have learned:
1. What safeguarding is and why it matters
2. The Care Act 2014 and the six safeguarding principles
3. The different types of abuse and neglect
4. How to recognise the signs of abuse
5. How to respond to a disclosure
6. The Mental Capacity Act 2005 and best interests decisions
7. Your duty to report and whistleblowing protections
8. The safeguarding referral process
9. Good record keeping and confidentiality
10. Reflective practice and continuing development

> **Final Message:** You are now equipped with the knowledge to recognise abuse, respond appropriately, and play your part in keeping adults safe. Safeguarding is everyone's responsibility — and you are making a difference every day. Thank you for completing this course.`
        }
      ]
    }
  ]
};

// ─── Seeder Component ────────────────────────────────────────────────────────

export default function CourseSeeder() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(false);

  const addLog = (msg) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]);

  const seed = async () => {
    setLoading(true);
    setLog([]);
    setDone(false);

    try {
      for (const courseDef of [FIRST_AID_COURSE, SAFEGUARDING_COURSE]) {
        addLog(`Checking if "${courseDef.title}" already exists...`);

        // Check for existing course
        const existing = await base44.entities.Course.list();
        const found = existing.find(c => c.title === courseDef.title);
        if (found) {
          addLog(`⏭ Course "${courseDef.title}" already exists (id: ${found.id}). Skipping.`);
          continue;
        }

        // Create course
        addLog(`Creating course: ${courseDef.title}`);
        const course = await base44.entities.Course.create({
          title: courseDef.title,
          description: courseDef.description,
          category: courseDef.category,
          difficulty_level: courseDef.difficulty_level,
          duration_minutes: courseDef.duration_minutes,
          passing_score: courseDef.passing_score,
          expiry_days: courseDef.expiry_days,
          is_archived: false
        });
        addLog(`Course created: ${course.id}`);

        // Create modules and lessons
        for (const modDef of courseDef.modules) {
          addLog(`  Creating module: ${modDef.title}`);
          const mod = await base44.entities.Module.create({
            course_id: course.id,
            title: modDef.title,
            description: modDef.description,
            order_index: modDef.order_index
          });
          addLog(`  Module created: ${mod.id}`);

          for (const lesDef of modDef.lessons) {
            addLog(`    Creating lesson: ${lesDef.title}`);
            await base44.entities.Lesson.create({
              course_id: course.id,
              module_id: mod.id,
              title: lesDef.title,
              description: lesDef.description,
              content: lesDef.content,
              content_type: lesDef.content_type || 'text',
              video_url: lesDef.video_url || null,
              document_url: lesDef.document_url || null,
              order_index: lesDef.order_index,
              has_assessment: lesDef.has_assessment || false
            });
            addLog(`    Lesson created.`);
          }
        }

        addLog(`Course "${courseDef.title}" seeded successfully.`);
      }

      setDone(true);
      toast.success('All courses seeded successfully!');
    } catch (err) {
      addLog(`ERROR: ${err.message}`);
      toast.error(`Seeding failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Course Seeder — Admin Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            This tool creates the two built-in UK training courses with all modules, lessons, video URLs, and written content. It is safe to run multiple times — existing courses will be skipped.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4 border-teal-200 bg-teal-50">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-slate-900">First Aid, CPR & AED</p>
                  <p className="text-xs text-slate-600 mt-1">6 modules, 17 lessons. UK Resuscitation Council 2021 guidelines, HSE requirements. YouTube videos from St John Ambulance & British Red Cross.</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-indigo-200 bg-indigo-50">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-slate-900">Safeguarding Adults</p>
                  <p className="text-xs text-slate-600 mt-1">6 modules, 17 lessons. Care Act 2014, Mental Capacity Act 2005, Skills for Care standards. Real-world case studies.</p>
                </div>
              </div>
            </Card>
          </div>

          <Button
            onClick={seed}
            disabled={loading || done}
            className="w-full bg-teal-600 hover:bg-teal-700 min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding courses...
              </>
            ) : done ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                All courses seeded
              </>
            ) : (
              'Seed Training Courses'
            )}
          </Button>

          {log.length > 0 && (
            <div className="bg-slate-900 text-green-400 rounded-lg p-4 max-h-80 overflow-y-auto font-mono text-xs space-y-0.5">
              {log.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
