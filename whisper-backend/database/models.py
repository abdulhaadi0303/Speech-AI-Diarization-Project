# database/models.py - Database Models for Analysis Prompts (FIXED ENCODING)

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

Base = declarative_base()

class AnalysisPrompt(Base):
    """Model for storing analysis prompts"""
    __tablename__ = "analysis_prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True)  # unique identifier (e.g., 'summary', 'sentiment')
    title = Column(String(200), nullable=False)  # Display title
    description = Column(Text)  # Brief description
    prompt_template = Column(Text, nullable=False)  # The actual prompt with {transcript} placeholder
    icon = Column(String(50), default="Brain")  # Lucide icon name
    emoji = Column(String(10), default="🤖")  # FIXED: Proper UTF-8 emoji
    category = Column(String(50), default="general")  # Category (general, meeting, content, etc.)
    gradient_from = Column(String(20), default="cyan-500")  # Tailwind gradient start
    gradient_to = Column(String(20), default="cyan-600")  # Tailwind gradient end
    is_active = Column(Boolean, default=True)  # Enable/disable prompt
    is_system = Column(Boolean, default=False)  # System prompts (cannot be deleted)
    max_tokens = Column(Integer, default=2000)  # Max tokens for this prompt
    estimated_time = Column(Float, default=30.0)  # Estimated processing time in seconds
    usage_count = Column(Integer, default=0)  # Track usage statistics
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100), default="system")  # Who created this prompt
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "key": self.key,
            "title": self.title,
            "description": self.description,
            "prompt_template": self.prompt_template,
            "icon": self.icon,
            "emoji": self.emoji,
            "category": self.category,
            "gradient_from": self.gradient_from,
            "gradient_to": self.gradient_to,
            "is_active": self.is_active,
            "is_system": self.is_system,
            "max_tokens": self.max_tokens,
            "estimated_time": self.estimated_time,
            "usage_count": self.usage_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "created_by": self.created_by
        }

class AnalysisResult(Base):
    """Model for storing analysis results"""
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), index=True)
    prompt_key = Column(String(50), index=True)
    prompt_title = Column(String(200))
    response_text = Column(Text)
    model_used = Column(String(50))
    processing_time = Column(Float)
    transcript_length = Column(Integer)
    tokens_used = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "prompt_key": self.prompt_key,
            "prompt_title": self.prompt_title,
            "response_text": self.response_text,
            "model_used": self.model_used,
            "processing_time": self.processing_time,
            "transcript_length": self.transcript_length,
            "tokens_used": self.tokens_used,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# Database setup
class DatabaseManager:
    def __init__(self, database_url: str = None):
        if database_url is None:
            # Default to SQLite in the project directory
            database_url = f"sqlite:///{os.path.join(os.getcwd(), 'speech_analysis.db')}"
        
        self.database_url = database_url
        self.engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False} if "sqlite" in database_url else {}
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
    def create_tables(self):
        """Create all tables"""
        try:
            Base.metadata.create_all(bind=self.engine)
            print("Database tables created successfully")
        except Exception as e:
            print(f"Error creating database tables: {e}")
            raise
        
    def get_session(self):
        """Get database session"""
        return self.SessionLocal()
        
    def init_default_prompts(self):
        """Initialize database with default system prompts"""
        session = self.get_session()
        try:
            # Check if prompts already exist
            existing_count = session.query(AnalysisPrompt).count()
            if existing_count > 0:
                print(f"Database already has {existing_count} prompts")
                return
                
            default_prompts = [
                {
                    "key": "summary",
                    "title": "Conversation Summary",
                    "description": "Generate a comprehensive summary of the entire conversation, highlighting key points and main topics discussed.",
                    "prompt_template": """Analyze this transcript and provide a comprehensive summary:

{transcript}

Please provide:
1. **Main Topics Discussed**: Key themes and subjects
2. **Key Points**: Important information shared
3. **Action Items**: Any tasks, decisions, or next steps mentioned
4. **Participants' Contributions**: Brief overview of what each speaker contributed

Format your response clearly with headers and bullet points.""",
                    "icon": "FileText",
                    "emoji": "📋",  # FIXED: Proper UTF-8 emoji
                    "category": "general",
                    "gradient_from": "cyan-500",
                    "gradient_to": "cyan-600",
                    "is_system": True,
                    "estimated_time": 25.0
                },
                {
                    "key": "action_items",
                    "title": "Action Items & Tasks",
                    "description": "Extract action items, tasks, decisions, and follow-up items mentioned in the conversation.",
                    "prompt_template": """Extract all action items, tasks, and decisions from this transcript:

{transcript}

Provide:
1. **Action Items**: Specific tasks mentioned
2. **Decisions Made**: Clear decisions or conclusions
3. **Deadlines**: Any time-sensitive items
4. **Responsible Parties**: Who is assigned to what (if mentioned)
5. **Follow-up Required**: Items needing further discussion

Be specific and actionable.""",
                    "icon": "CheckSquare",
                    "emoji": "✅",  # FIXED: Proper UTF-8 emoji
                    "category": "productivity",
                    "gradient_from": "green-500",
                    "gradient_to": "green-600",
                    "is_system": True,
                    "estimated_time": 20.0
                },
                {
                    "key": "sentiment_analysis",
                    "title": "Sentiment & Tone Analysis",
                    "description": "Analyze the emotional tone and sentiment throughout the conversation.",
                    "prompt_template": """Analyze the sentiment and tone of this conversation:

{transcript}

Provide:
1. **Overall Sentiment**: Positive, negative, or neutral with explanation
2. **Tone Analysis**: Professional, casual, tense, collaborative, etc.
3. **Emotional Highlights**: Key emotional moments or shifts
4. **Speaker Dynamics**: How speakers interacted emotionally
5. **Recommendations**: Suggestions for improving communication if needed

Be objective and provide specific examples.""",
                    "icon": "Heart",
                    "emoji": "😊",  # FIXED: Proper UTF-8 emoji
                    "category": "analysis",
                    "gradient_from": "pink-500",
                    "gradient_to": "pink-600",
                    "is_system": True,
                    "estimated_time": 30.0
                },
                {
                    "key": "key_insights",
                    "title": "Key Insights & Takeaways",
                    "description": "Identify important insights, discoveries, and valuable information from the conversation.",
                    "prompt_template": """Analyze this transcript for key insights and important information:

{transcript}

Identify:
1. **Key Insights**: Most important discoveries or realizations
2. **Interesting Points**: Notable or surprising information
3. **Patterns**: Recurring themes or topics
4. **Concerns Raised**: Problems or issues mentioned
5. **Opportunities**: Potential opportunities discussed

Focus on the most valuable and actionable insights.""",
                    "icon": "Lightbulb",
                    "emoji": "💡",  # FIXED: Proper UTF-8 emoji
                    "category": "analysis",
                    "gradient_from": "yellow-500",
                    "gradient_to": "yellow-600",
                    "is_system": True,
                    "estimated_time": 35.0
                },
                {
                    "key": "meeting_notes",
                    "title": "Professional Meeting Notes",
                    "description": "Convert the conversation into structured, professional meeting notes.",
                    "prompt_template": """Convert this transcript into professional meeting notes:

{transcript}

Structure as:
1. **Meeting Overview**: Brief description
2. **Attendees**: Speakers identified
3. **Agenda Items**: Topics covered
4. **Discussion Points**: Key discussions per topic
5. **Decisions**: Conclusions reached
6. **Action Items**: Next steps with owners
7. **Next Meeting**: If mentioned

Use professional formatting suitable for distribution.""",
                    "icon": "Calendar",
                    "emoji": "📝",  # FIXED: Proper UTF-8 emoji
                    "category": "meeting",
                    "gradient_from": "blue-500",
                    "gradient_to": "blue-600",
                    "is_system": True,
                    "estimated_time": 40.0
                },
                {
                    "key": "questions_answers",
                    "title": "Q&A Extraction",
                    "description": "Extract all questions asked and answers provided during the conversation.",
                    "prompt_template": """Extract all questions and answers from this transcript:

{transcript}

Format as:
**Q: [Question asked]**
A: [Answer provided]

Include:
- All direct questions asked by any speaker
- The corresponding answers or responses
- Note if questions were left unanswered
- Identify who asked what (if clear from context)

Focus on substantive questions and answers, not small talk.""",
                    "icon": "HelpCircle",
                    "emoji": "❓",  # FIXED: Proper UTF-8 emoji
                    "category": "content",
                    "gradient_from": "purple-500",
                    "gradient_to": "purple-600",
                    "is_system": True,
                    "estimated_time": 25.0
                }
            ]
            
            for prompt_data in default_prompts:
                prompt = AnalysisPrompt(**prompt_data)
                session.add(prompt)
                
            session.commit()
            print(f"Initialized {len(default_prompts)} default prompts")
            
        except Exception as e:
            session.rollback()
            print(f"Error initializing prompts: {e}")
            raise
        finally:
            session.close()

# Initialize database manager (will be imported by main.py)
db_manager = DatabaseManager()