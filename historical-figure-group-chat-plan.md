# Historical Figure Group Chat — Project Plan

> A 2026-worthy interactive experience where history's greatest minds converse, debate, and clash in real-time.

---

## 🎯 Project Vision

**"What if Einstein, Cleopatra, and Shakespeare were in a WhatsApp group?"**

An interactive web application where users select historical figures, set a topic, and watch them engage in dynamic, personality-driven conversations. Users can observe, participate, and shape the discourse in real-time.

---

## 🧠 Core Concept

| Element | Description |
|---------|-------------|
| **Figures** | AI-powered historical characters with distinct personalities, worldviews, and speaking styles |
| **Topics** | Any question or prompt the user provides — philosophical, absurd, or anything in between |
| **Chat** | Real-time streaming group conversation where figures interact with each other AND the user |
| **Moderation** | User can interject, steer, summon new figures, or remove disruptive ones |

---

## 👥 Historical Figure Roster

### Ancient Era
| Figure | Era | Personality Traits | Speaking Style |
|--------|-----|-------------------|----------------|
| **Cleopatra VII** | 69-30 BCE | Cunning, charismatic, politically savvy, multilingual | Regal, strategic, occasionally seductive, references Egyptian mythology |
| **Plato** | 428-348 BCE | Philosophical, idealistic, questioning, academic | Socratic method, allegories, references to "the Forms" |
| **Archimedes** | 287-212 BCE | Brilliant, obsessive, eccentric, practical | Excited about math/physics, "Eureka!" moments, geometry metaphors |

### Renaissance & Enlightenment
| Figure | Era | Personality Traits | Speaking Style |
|--------|-----|-------------------|----------------|
| **Leonardo da Vinci** | 1452-1519 | Curious, polymath, artistic, visionary | Observational, sketches ideas verbally, connects disparate fields |
| **William Shakespeare** | 1564-1616 | Witty, poetic, dramatic, observant | iambic tendencies, invented words, theatrical metaphors |
| **Isaac Newton** | 1643-1727 | Brilliant, solitary, prickly, religious | Formal, precise, occasionally arrogant, alchemical references |

### 19th Century
| Figure | Era | Personality Traits | Speaking Style |
|--------|-----|-------------------|----------------|
| **Abraham Lincoln** | 1809-1865 | Wise, folksy, melancholic, principled | Frontier idioms, storytelling, moral weight |
| **Nikola Tesla** | 1856-1943 | Visionary, eccentric, idealistic, bitter | Technical but poetic, obsessed with future, anti-Edison |
| **Thomas Edison** | 1847-1931 | Practical, business-minded, stubborn, competitive | Pragmatic, defensive about legacy, pro-commercialization |

### 20th Century
| Figure | Era | Personality Traits | Speaking Style |
|--------|-----|-------------------|----------------|
| **Albert Einstein** | 1879-1955 | Playful, brilliant, humble, pacifist | Thought experiments, relativity metaphors, German-accented playfulness |
| **Marie Curie** | 1867-1934 | Dedicated, modest, pioneering, persistent | Scientific precision, references to radiation/discovery, Polish pride |
| **Mahatma Gandhi** | 1869-1948 | Peaceful, principled, witty, stubborn | Parables, nonviolence philosophy, simple but profound |
| **Winston Churchill** | 1874-1965 | Witty, stubborn, eloquent, irascible | Rhetorical flourishes, war metaphors, British dry humor |
| **Frida Kahlo** | 1907-1954 | Passionate, surreal, raw, defiant | Visceral imagery, references to pain/art, Mexican pride |
| **Martin Luther King Jr.** | 1929-1968 | Eloquent, principled, passionate, hopeful | Rhythmic oratory, biblical references, moral clarity |

### Bonus / Unlockable
| Figure | Era | Personality Traits | Speaking Style |
|--------|-----|-------------------|----------------|
| **Socrates** | 470-399 BCE | Questioning, ironic, irritating, wise | Only asks questions, never answers |
| **Genghis Khan** | 1162-1227 | Ruthless, strategic, practical, loyal | Direct, conquest metaphors, meritocratic views |
| **Marilyn Monroe** | 1926-1962 | Charming, vulnerable, intelligent, underestimated | Breathless delivery, references to fame/loneliness |
| **Bruce Lee** | 1940-1973 | Philosophical, disciplined, charismatic, profound | Martial arts metaphors, "be like water", direct wisdom |

---

## 🎨 Design Specifications

### Visual Identity
- **Theme**: Dark mode primary, with "antique paper" light mode option
- **Typography**: Elegant serif for figure names, clean sans-serif for chat
- **Color Palette**: 
  - Primary: Deep navy (#1a1a2e)
  - Accent: Antique gold (#d4af37)
  - Each figure gets a signature color for their chat bubbles

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Historical Figure Group Chat                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SELECTED FIGURES (avatar row)                   │   │
│  │  [Einstein] [Cleopatra] [Shakespeare] [Tesla]    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  CHAT AREA                                       │   │
│  │                                                  │   │
│  │  🟡 Einstein: But consider this thought          │   │
│  │  experiment...                                   │   │
│  │                                                  │   │
│  │  🔴 Cleopatra: While you ponder the stars,       │   │
│  │  I worry about empires...                        │   │
│  │                                                  │   │
│  │  🟢 Shakespeare: Aye, but what's empire          │   │
│  │  without a good tragedy?                         │   │
│  │                                                  │   │
│  │  [streaming response appearing...]               │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Type your message...]              [Send]      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  SIDEBAR: [+ Add Figure] [⚙ Settings] [Export]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technical Architecture

### Frontend (Next.js 15 + React 19)
- **App Router** with server components for initial load
- **Client components** for real-time chat interactions
- **Tailwind CSS 4** for styling
- **shadcn/ui** for base components
- **Framer Motion** for smooth animations

### Backend (Next.js API Routes)
- **Streaming API** using Vercel AI SDK patterns
- **z-ai-web-dev-sdk** for LLM calls
- Each figure has a distinct system prompt
- Conversation context management

### Data Flow
```
User selects figures + topic
        ↓
Frontend sends to API
        ↓
API creates system prompts for each figure
        ↓
LLM generates response for Figure 1 (streaming)
        ↓
Frontend renders response in real-time
        ↓
LLM generates response for Figure 2 (aware of Figure 1's response)
        ↓
...continues with conversation memory...
```

---

## 📋 Development Phases

### Phase 1: Foundation (MVP)
- [ ] Next.js project setup
- [ ] Historical figure data + system prompts
- [ ] Figure selection UI
- [ ] Basic chat interface
- [ ] Single LLM call returning figure responses

### Phase 2: Real-time Magic
- [ ] Streaming responses (watch them "type")
- [ ] Conversation memory between figures
- [ ] User can send messages
- [ ] Figures respond to user input

### Phase 3: Visual Polish
- [ ] AI-generated character portraits
- [ ] Animated chat bubbles
- [ ] Figure-specific styling
- [ ] Dark/light mode toggle

### Phase 4: Interactivity
- [ ] Add figures mid-conversation
- [ ] Remove figures from chat
- [ ] Pre-built conversation starters
- [ ] Export conversation as text/image

### Phase 5: Advanced Features (If Time Permits)
- [ ] Text-to-speech for figures
- [ ] Share conversation links
- [ ] Conversation branching
- [ ] "Famous debates" mode

---

## 🤖 AI Implementation Details

### System Prompt Structure
Each figure gets a comprehensive system prompt:

```
You are [NAME], the historical figure from [ERA].

CORE IDENTITY:
[2-3 sentences about who they are, their achievements, worldview]

PERSONALITY TRAITS:
- [Trait 1]
- [Trait 2]
- [Trait 3]

SPEAKING STYLE:
[Specific instructions about vocabulary, tone, mannerisms]

KNOWLEDGE BOUNDARY:
You only know what someone from [ERA] would know, plus what you could reasonably infer about modern concepts if they were explained to you.

RELATIONSHIPS WITH OTHER FIGURES:
[Notes about historical relationships, e.g., Tesla dislikes Edison]

When responding in a group chat:
1. Stay in character at all times
2. React to what others have said
3. Be conversational, not lecture-y
4. Show personality through reactions (agreement, disagreement, sass)
5. Reference your historical context when relevant

Keep responses concise (2-4 sentences typically) to maintain conversation flow.
```

### Conversation Memory
- Maintain rolling context of last N messages
- Each figure receives context of what was said before their turn
- User messages are treated as "the Moderator" speaking

---

## 📁 File Structure

```
historical-figure-chat/
├── app/
│   ├── page.tsx                 # Main chat page
│   ├── layout.tsx               # App layout
│   ├── globals.css              # Global styles
│   └── api/
│       └── chat/
│           └── route.ts         # Streaming chat API
├── components/
│   ├── FigureSelector.tsx       # Select historical figures
│   ├── ChatArea.tsx             # Main chat display
│   ├── ChatBubble.tsx           # Individual message
│   ├── UserInput.tsx            # User message input
│   ├── FigureAvatar.tsx         # Avatar component
│   └── Sidebar.tsx              # Controls sidebar
├── lib/
│   ├── figures.ts               # Figure data + prompts
│   └── utils.ts                 # Utility functions
├── public/
│   └── portraits/               # AI-generated portraits
└── package.json
```

---

## 🎯 Success Criteria

| Metric | Target |
|--------|--------|
| Response quality | Each figure sounds distinct and historically plausible |
| Streaming latency | First token within 1 second |
| User engagement | Easy to start a conversation, addictive to watch |
| Visual polish | Feels like a premium 2026 product |

---

## 🚀 Next Steps

1. Initialize Next.js project with fullstack-dev skill
2. Build figure data structure and system prompts
3. Create basic UI with figure selection
4. Implement streaming chat API
5. Connect frontend to backend
6. Polish, test, iterate

---

*Last updated: 2026-03-22*
