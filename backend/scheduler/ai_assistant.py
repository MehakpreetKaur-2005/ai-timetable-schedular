"""
AI Assistant using Groq API
Provides intelligent scheduling suggestions and constraint analysis
"""

import logging
from typing import Dict, List, Optional
from groq import Groq
import json

from config import get_settings

logger = logging.getLogger(__name__)


class AISchedulingAssistant:
    """
    AI-powered scheduling assistant using Groq's Llama models
    
    Capabilities:
    - Analyze scheduling constraints
    - Suggest optimal faculty-course assignments
    - Identify potential conflicts
    - Provide reasoning for decisions
    """
    
    def __init__(self):
        settings = get_settings()
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.ai_model
        self.temperature = settings.ai_temperature
        self.max_tokens = settings.ai_max_tokens
        
        logger.info(f"AI Assistant initialized with model: {self.model}")
    
    def analyze_faculty_course_fit(
        self,
        course_name: str,
        course_details: str,
        faculty_list: List[Dict],
        student_strength: int
    ) -> Dict:
        """
        Use AI to analyze which faculty member is best suited for a course
        
        Returns:
            {
                "recommended_faculty_id": str,
                "reasoning": str,
                "confidence": float,
                "alternatives": List[str]
            }
        """
        
        # Prepare faculty information
        faculty_info = "\n".join([
            f"- {f['name']} (ID: {f['id']}): Specializations: {', '.join(f.get('specializations', []))}, "
            f"Max Hours: {f.get('max_hours_per_week', 20)}/week"
            for f in faculty_list
        ])
        
        prompt = f"""You are an expert academic scheduling advisor. Analyze which faculty member is best suited to teach the following course.

Course: {course_name}
Details: {course_details}
Student Strength: {student_strength}

Available Faculty:
{faculty_info}

Provide your recommendation in the following JSON format:
{{
    "recommended_faculty_id": "faculty ID",
    "reasoning": "detailed explanation of why this faculty is best suited",
    "confidence": 0.0-1.0 (how confident you are),
    "alternatives": ["alternative faculty ID 1", "alternative faculty ID 2"]
}}

Consider:
1. Faculty specializations matching course content
2. Workload balance
3. Teaching capacity for student strength
4. Overall fit

Respond ONLY with valid JSON, no additional text."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert academic scheduling advisor. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                result = json.loads(result_text)
                logger.info(f"AI recommendation for {course_name}: {result.get('recommended_faculty_id')}")
                return result
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                logger.warning(f"Failed to parse AI response as JSON: {result_text}")
                return {
                    "recommended_faculty_id": faculty_list[0]['id'] if faculty_list else None,
                    "reasoning": "AI response parsing failed, using fallback",
                    "confidence": 0.3,
                    "alternatives": []
                }
                
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            return {
                "recommended_faculty_id": faculty_list[0]['id'] if faculty_list else None,
                "reasoning": f"Error occurred: {str(e)}",
                "confidence": 0.0,
                "alternatives": []
            }
    
    def suggest_optimal_timeslot(
        self,
        course_name: str,
        faculty_name: str,
        existing_schedule: List[Dict],
        available_slots: List[Dict]
    ) -> Dict:
        """
        AI suggests optimal time slot based on existing schedule patterns
        
        Returns:
            {
                "recommended_slot_id": str,
                "reasoning": str,
                "avoid_slots": List[str]
            }
        """
        
        # Summarize existing schedule
        schedule_summary = "\n".join([
            f"- {s.get('course', 'Unknown')} with {s.get('faculty', 'Unknown')} "
            f"on {s.get('day', 'Unknown')} at {s.get('time', 'Unknown')}"
            for s in existing_schedule[:10]  # Limit to avoid token overflow
        ])
        
        slots_info = "\n".join([
            f"- Slot {s['id']}: {s['day']} {s['start_time']}-{s['end_time']}"
            for s in available_slots
        ])
        
        prompt = f"""You are a scheduling optimization expert. Suggest the best time slot for a new class.

New Class:
- Course: {course_name}
- Faculty: {faculty_name}

Existing Schedule (sample):
{schedule_summary}

Available Time Slots:
{slots_info}

Provide your recommendation in JSON format:
{{
    "recommended_slot_id": "slot ID",
    "reasoning": "why this slot is optimal",
    "avoid_slots": ["slot IDs to avoid"]
}}

Consider:
1. Avoid back-to-back classes for same faculty
2. Prefer morning slots for theoretical courses
3. Balance across days
4. Minimize gaps in faculty schedule

Respond ONLY with valid JSON."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a scheduling optimization expert. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=1000
            )
            
            result_text = response.choices[0].message.content.strip()
            result = json.loads(result_text)
            return result
            
        except Exception as e:
            logger.error(f"Error in timeslot suggestion: {e}")
            return {
                "recommended_slot_id": available_slots[0]['id'] if available_slots else None,
                "reasoning": f"Error: {str(e)}",
                "avoid_slots": []
            }
    
    def analyze_schedule_quality(
        self,
        schedule: List[Dict],
        fitness_score: float
    ) -> Dict:
        """
        AI analyzes the quality of generated schedule and suggests improvements
        
        Returns:
            {
                "overall_assessment": str,
                "strengths": List[str],
                "weaknesses": List[str],
                "improvement_suggestions": List[str]
            }
        """
        
        # Prepare schedule summary
        schedule_by_day = {}
        for entry in schedule:
            day = entry.get('day', 'Unknown')
            if day not in schedule_by_day:
                schedule_by_day[day] = []
            schedule_by_day[day].append(
                f"{entry.get('course_name', 'Unknown')} - "
                f"{entry.get('faculty_name', 'Unknown')} - "
                f"{entry.get('start_time', 'Unknown')}"
            )
        
        schedule_summary = "\n".join([
            f"{day}:\n  " + "\n  ".join(classes)
            for day, classes in schedule_by_day.items()
        ])
        
        prompt = f"""Analyze this academic timetable and provide expert feedback.

Fitness Score: {fitness_score:.2f}/1.00

Schedule:
{schedule_summary}

Provide analysis in JSON format:
{{
    "overall_assessment": "brief overall quality assessment",
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "improvement_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}

Consider:
- Distribution across days
- Faculty workload balance
- Time slot utilization
- Potential conflicts or gaps

Respond ONLY with valid JSON."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an academic timetable quality analyst. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=1500
            )
            
            result_text = response.choices[0].message.content.strip()
            result = json.loads(result_text)
            logger.info("AI schedule analysis completed")
            return result
            
        except Exception as e:
            logger.error(f"Error in schedule analysis: {e}")
            return {
                "overall_assessment": f"Analysis failed: {str(e)}",
                "strengths": [],
                "weaknesses": [],
                "improvement_suggestions": []
            }
    
    def suggest_schedule_swaps(
        self,
        schedule: List[Dict],
        fitness_score: float,
        constraint_details: Dict,
        available_faculty: List[Dict],
        available_rooms: List[Dict],
        available_timeslots: List[Dict]
    ) -> List[Dict]:
        """
        AI suggests specific swaps to improve the schedule.
        This is the optimization step — the AI identifies weaknesses
        and returns actionable changes.
        
        Returns:
            List of swap suggestions:
            [
                {
                    "entry_index": int,
                    "field": "faculty_id" | "room_id" | "timeslot_id",
                    "new_value": str,
                    "reason": str
                }
            ]
        """
        
        # Build compact schedule summary with indices
        schedule_lines = []
        for i, entry in enumerate(schedule[:30]):  # Limit to avoid token overflow
            schedule_lines.append(
                f"[{i}] {entry.get('course_name','?')} | "
                f"Faculty: {entry.get('faculty_name','?')} (id:{entry.get('faculty_id','?')}) | "
                f"Room: {entry.get('room_name','?')} (id:{entry.get('room_id','?')}) | "
                f"{entry.get('day','?')} {entry.get('start_time','?')}-{entry.get('end_time','?')} "
                f"(ts_id:{entry.get('timeslot_id','?')})"
            )
        
        # Available resources summary
        faculty_ids = ", ".join([f"{f['name']}(id:{f['id']})" for f in available_faculty[:15]])
        room_ids = ", ".join([f"{r['name']}(id:{r['id']},cap:{r.get('capacity','?')})" for r in available_rooms[:15]])
        timeslot_ids = ", ".join([
            f"{t.get('day','?')} {t.get('start_time','?')}-{t.get('end_time','?')}(id:{t['id']})"
            for t in available_timeslots[:20]
        ])
        
        prompt = f"""You are an expert timetable optimizer. The current schedule has a fitness score of {fitness_score:.3f}/1.000.

CONSTRAINT VIOLATIONS:
- Faculty clashes penalty: {constraint_details.get('faculty_clashes', 0)}
- Room clashes penalty: {constraint_details.get('room_clashes', 0)}
- Capacity violations penalty: {constraint_details.get('capacity_violations', 0)}
- Workload violations penalty: {constraint_details.get('workload_violations', 0)}
- Preference score: {constraint_details.get('preference_score', 0)}
- Gap penalty: {constraint_details.get('gap_penalty', 0)}
- Distribution score: {constraint_details.get('distribution_score', 0)}

CURRENT SCHEDULE (index | course | faculty | room | timeslot):
{chr(10).join(schedule_lines)}

AVAILABLE FACULTY: {faculty_ids}
AVAILABLE ROOMS: {room_ids}
AVAILABLE TIMESLOTS: {timeslot_ids}

Suggest up to 5 specific swaps to fix violations and improve the schedule.
Each swap should change ONE field of ONE entry.
Prioritize fixing hard constraint violations (clashes, capacity) first, then soft constraints.

Respond with a JSON array:
[
    {{
        "entry_index": 0,
        "field": "faculty_id",
        "new_value": "the new ID to assign",
        "reason": "brief reason"
    }}
]

Rules:
- "field" must be one of: "faculty_id", "room_id", "timeslot_id"
- "new_value" must be a valid ID from the available resources listed above
- Only suggest swaps that would actually fix a problem
- If the schedule looks good (no violations), return an empty array: []

Respond ONLY with valid JSON array."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a timetable optimization engine. Return ONLY a valid JSON array of swap suggestions."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more precise suggestions
                max_tokens=1500
            )
            
            result_text = response.choices[0].message.content.strip()
            result = json.loads(result_text)
            
            if not isinstance(result, list):
                result = []
            
            # Validate each suggestion
            valid_swaps = []
            valid_fields = {"faculty_id", "room_id", "timeslot_id"}
            for swap in result:
                if (isinstance(swap, dict) and
                    "entry_index" in swap and
                    "field" in swap and
                    "new_value" in swap and
                    swap["field"] in valid_fields and
                    isinstance(swap["entry_index"], int) and
                    0 <= swap["entry_index"] < len(schedule)):
                    valid_swaps.append(swap)
            
            logger.info(f"AI suggested {len(valid_swaps)} valid swaps (from {len(result)} total)")
            return valid_swaps
            
        except Exception as e:
            logger.error(f"Error in AI swap suggestion: {e}")
            return []
    
    def get_scheduling_insights(
        self,
        courses: List[Dict],
        faculty: List[Dict],
        rooms: List[Dict]
    ) -> Dict:
        """
        Get general insights about the scheduling problem before generation
        
        Returns insights about potential challenges and optimal strategies
        """
        
        prompt = f"""Analyze this scheduling problem and provide insights.

Courses: {len(courses)} courses, total students: {sum(c.get('student_strength', 0) for c in courses)}
Faculty: {len(faculty)} faculty members
Rooms: {len(rooms)} rooms with capacities: {', '.join(str(r.get('capacity', 0)) for r in rooms)}

Sample Courses:
{json.dumps(courses[:3], indent=2)}

Sample Faculty:
{json.dumps(faculty[:3], indent=2)}

Provide insights in JSON format:
{{
    "complexity_level": "low/medium/high",
    "potential_challenges": ["challenge 1", "challenge 2"],
    "optimization_tips": ["tip 1", "tip 2", "tip 3"],
    "estimated_difficulty": "description of scheduling difficulty"
}}

Respond ONLY with valid JSON."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a scheduling problem analyst. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=1000
            )
            
            result_text = response.choices[0].message.content.strip()
            result = json.loads(result_text)
            return result
            
        except Exception as e:
            logger.error(f"Error getting insights: {e}")
            return {
                "complexity_level": "unknown",
                "potential_challenges": [],
                "optimization_tips": [],
                "estimated_difficulty": f"Error: {str(e)}"
            }