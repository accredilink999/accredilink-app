import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  ChevronDown, 
  Clock, 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Bell, 
  AlertTriangle,
  GraduationCap,
  Bot,
  Settings,
  Home,
  MapPin,
  Pill,
  ClipboardList,
  LogIn,
  LogOut,
  Heart
} from 'lucide-react';

const sections = [
  {
    title: "Getting Started",
    icon: Home,
    color: "bg-teal-50 hover:bg-teal-100",
    content: `
**Welcome to CareCallAI!**

This app helps you manage your daily care work efficiently. Here's what you need to know:

1. **Dashboard** - Your home screen showing today's shifts, alerts, and quick actions
2. **Navigation** - Use the menu (☰) to access all features
3. **Profile** - Update your personal details and photo
4. **Notifications** - Stay informed about important updates

**First Steps:**
- Complete your profile with accurate contact details
- Review your assigned shifts in the Rota
- Familiarise yourself with your assigned clients
    `
  },
  {
    title: "Clocking In & Out of Shifts",
    icon: Clock,
    color: "bg-blue-50 hover:bg-blue-100",
    content: `
**Starting Your Shift:**

1. Go to **Dashboard** or **Rota**
2. Find your scheduled shift
3. Tap the **Clock In** button when you arrive
4. Your location will be recorded automatically
5. The system will note the exact time you started

**Ending Your Shift:**

1. Complete all required tasks and care logs
2. Tap the **Clock Out** button
3. Your location and end time will be recorded
4. Review your shift summary

**Important Notes:**
- Always clock in when you arrive at the location
- Clock out only after completing all documentation
- If you forget to clock in/out, notify your supervisor
- Your GPS location is tracked for verification
    `
  },
  {
    title: "Booking Into & Out of Client Visits",
    icon: MapPin,
    color: "bg-green-50 hover:bg-green-100",
    content: `
**Arriving at a Client:**

1. Open the client's profile or your shift details
2. Tap **Book In** or **Start Visit**
3. Confirm you have arrived at the client's location
4. The system records your arrival time and location

**During the Visit:**
- Complete all assigned tasks
- Record any observations
- Administer medications if required
- Update care logs

**Leaving a Client:**

1. Ensure all tasks are completed
2. Tap **Book Out** or **End Visit**
3. Complete any required care log entries
4. The system records your departure time

**Tips:**
- Book in as soon as you arrive
- Don't leave without booking out
- Double-check care logs before leaving
    `
  },
  {
    title: "Care Logs",
    icon: ClipboardList,
    color: "bg-purple-50 hover:bg-purple-100",
    content: `
**What are Care Logs?**

Care logs document the care provided during each visit. They are essential for:
- Continuity of care
- Legal compliance
- Communication with other carers

**Creating a Care Log:**

1. Open the client's profile or your current shift
2. Tap **Add Care Log** or **Quick Log**
3. Fill in the required information:
   - **Mood** - How was the client feeling?
   - **Food Intake** - Did they eat well?
   - **Fluid Intake** - Did they drink enough?
   - **Personal Care** - What care was provided?
   - **Notes** - Any observations or concerns

**Best Practices:**
- Be specific and factual
- Record observations immediately
- Note any changes from normal
- Report concerns to supervisors
- Include positive observations too
    `
  },
  {
    title: "Medication Administration (MAR Charts)",
    icon: Pill,
    color: "bg-red-50 hover:bg-red-100",
    content: `
**Recording Medication:**

1. Go to the client's profile
2. Open the **MAR Chart** section
3. Find the medication to administer
4. Select the appropriate status:
   - **Given** - Medication administered successfully
   - **Refused** - Client refused medication
   - **Not Available** - Medication not in stock
   - **Hospital** - Client in hospital
   - **Self-Administered** - Client took it themselves

**Important Guidelines:**
- Always verify medication details before giving
- Check the 6 Rights: Right patient, drug, dose, route, time, documentation
- Record immediately after administration
- Report any errors or concerns immediately
- Never pre-sign medication records
    `
  },
  {
    title: "Client Management",
    icon: Users,
    color: "bg-orange-50 hover:bg-orange-100",
    content: `
**Viewing Client Information:**

1. Go to **Clients** from the menu
2. Search or browse to find a client
3. Tap on a client card to view details

**Client Profile Includes:**
- Personal details and photo
- Emergency contacts
- GP information
- Care plan
- Risk assessments
- Preferences and routines
- Medical history
- Key safe code (if applicable)

**Care Plan:**
- Review before each visit
- Follow the person-centred approach
- Note any specific requirements
- Check for updates regularly

**Risk Assessments:**
- Be aware of identified risks
- Follow management guidelines
- Report new risks immediately
    `
  },
  {
    title: "Rota & Scheduling",
    icon: Calendar,
    color: "bg-indigo-50 hover:bg-indigo-100",
    content: `
**Viewing Your Rota:**

1. Go to **Rota** from the menu
2. Switch between Day, Week, or Month view
3. Your shifts are highlighted
4. Tap any shift for details

**Shift Information Shows:**
- Start and end times
- Client details
- Location
- Tasks to complete
- Any special notes

**Requesting Time Off:**

1. Go to **My Approvals & Financials**
2. Select **Request Leave**
3. Choose dates and leave type
4. Add a reason
5. Submit for approval

**Shift Swaps:**
- Request to swap shifts with colleagues
- Wait for manager approval
- Check your messages for updates
    `
  },
  {
    title: "Chat & Messaging",
    icon: MessageSquare,
    color: "bg-cyan-50 hover:bg-cyan-100",
    content: `
**Starting a Conversation:**

1. Go to **Chat** from the menu
2. Tap the **+** button to start new chat
3. Select a colleague or create a group
4. Type your message and send

**Features:**
- Direct messages to colleagues
- Group chats for teams
- Share images and files
- Voice notes
- Reply to specific messages
- React with emojis

**Best Practices:**
- Keep messages professional
- Respond promptly to work queries
- Use group chats for team updates
- Don't share sensitive client info inappropriately
    `
  },
  {
    title: "Alerts & Notifications",
    icon: Bell,
    color: "bg-amber-50 hover:bg-amber-100",
    content: `
**Types of Notifications:**

- **Urgent Alerts** - Require immediate attention (red)
- **Weather Warnings** - Important weather updates
- **Announcements** - Team-wide messages
- **Shift Reminders** - Upcoming shift notifications
- **Leave Updates** - Approval/rejection notices

**Managing Notifications:**

1. Go to **Alerts/Notifications** from menu
2. View all current notifications
3. Mark as read when reviewed
4. Acknowledge important announcements

**Settings:**
- Customise which notifications you receive
- Set quiet hours
- Choose delivery methods
    `
  },
  {
    title: "Incident Reporting",
    icon: AlertTriangle,
    color: "bg-rose-50 hover:bg-rose-100",
    content: `
**When to Report an Incident:**

- Falls or injuries
- Medication errors
- Safeguarding concerns
- Near misses
- Equipment failures
- Complaints

**How to Report:**

1. Go to **Incidents** from menu
2. Tap **Report Incident**
3. Fill in all required details:
   - Type of incident
   - Date and time
   - Location
   - Description
   - Immediate actions taken
   - Witnesses

**Important:**
- Report as soon as possible
- Be factual and accurate
- Don't assign blame
- Follow up as required
- Cooperate with investigations
    `
  },
  {
    title: "Training",
    icon: GraduationCap,
    color: "bg-emerald-50 hover:bg-emerald-100",
    content: `
**Accessing Training:**

1. Go to **Training** from menu
2. View assigned courses
3. Track your progress
4. Complete assessments

**Training Types:**
- Mandatory training (must complete)
- Specialist training
- Refresher courses
- Induction modules

**Certificates:**
- Download completed certificates
- Track expiry dates
- Request new training

**Tips:**
- Complete mandatory training on time
- Note expiry dates for refreshers
- Request help if you're struggling
    `
  },
  {
    title: "Documents",
    icon: FileText,
    color: "bg-slate-100 hover:bg-slate-200",
    content: `
**Accessing Documents:**

1. Go to **My Documents** from menu
2. Browse by category:
   - Policies
   - Procedures
   - Forms
   - Training materials

**Your Personal Documents:**
- View uploaded certificates
- Access your contracts
- Download payslips (if available)

**Mandatory Reading:**
- Some documents require acknowledgement
- You'll be prompted to confirm you've read them
- Keep up to date with policy changes
    `
  },
  {
    title: "AI Assistant",
    icon: Bot,
    color: "bg-violet-50 hover:bg-violet-100",
    content: `
**Using the AI Assistant:**

1. Go to **AI Assistant** from menu
2. Type your question or request
3. Get instant helpful responses

**The AI Can Help With:**
- Answering care-related questions
- Finding information quickly
- Drafting messages
- General guidance

**Tips:**
- Be specific with questions
- The AI is a guide, not a replacement for training
- Always verify important information
- Report any issues with responses
    `
  },
  {
    title: "Settings & Profile",
    icon: Settings,
    color: "bg-gray-100 hover:bg-gray-200",
    content: `
**Updating Your Profile:**

1. Go to **My Profile** from the user menu
2. Edit your personal details
3. Upload or update your photo
4. Save changes

**Settings Options:**
- Notification preferences
- Appearance settings
- Privacy settings

**Important:**
- Keep your contact details up to date
- Update your emergency contact
- Review your profile regularly

**Logging Out:**
- Tap your profile picture
- Select **Sign Out**
- Always log out on shared devices
    `
  }
];

export default function AppHelpGuide() {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (index) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-6 h-6 text-teal-600" />
        <h2 className="text-lg font-semibold text-slate-900">CareCall AI User Guide</h2>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Tap on any section below to learn more about using the app.
      </p>
      
      {sections.map((section, index) => (
        <Collapsible key={index} open={openSections[index]} onOpenChange={() => toggleSection(index)}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className={`cursor-pointer ${section.color} transition-colors rounded-t-xl py-3`}>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <section.icon className="w-5 h-5 text-slate-700" />
                    {section.title}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections[index] ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <div className="prose prose-sm max-w-none text-slate-700">
                  {section.content.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h4 key={i} className="font-semibold text-slate-900 mt-3 mb-2">{line.replace(/\*\*/g, '')}</h4>;
                    } else if (line.startsWith('- **')) {
                      const parts = line.replace('- **', '').split('**');
                      return (
                        <div key={i} className="flex gap-2 ml-2 mb-1">
                          <span className="text-slate-400">•</span>
                          <span><strong>{parts[0]}</strong>{parts[1]}</span>
                        </div>
                      );
                    } else if (line.startsWith('- ')) {
                      return (
                        <div key={i} className="flex gap-2 ml-2 mb-1">
                          <span className="text-slate-400">•</span>
                          <span>{line.replace('- ', '')}</span>
                        </div>
                      );
                    } else if (line.match(/^\d+\./)) {
                      return (
                        <div key={i} className="flex gap-2 ml-2 mb-1">
                          <span className="text-teal-600 font-medium">{line.match(/^\d+/)[0]}.</span>
                          <span>{line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}</span>
                        </div>
                      );
                    } else if (line.trim()) {
                      return <p key={i} className="mb-2">{line}</p>;
                    }
                    return null;
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}