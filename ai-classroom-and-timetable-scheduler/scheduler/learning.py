"""
Learning Engine for Pattern Recognition and Bias
Learns from historical successful schedules
"""

import logging
from typing import List, Dict, Tuple
from collections import defaultdict
from scheduler.models import Gene, Chromosome

logger = logging.getLogger(__name__)


class LearningEngine:
    """
    Learns patterns from successful timetable solutions
    
    Learning Strategies:
    1. Track successful course-faculty-timeslot combinations
    2. Learn room preferences for courses
    3. Identify patterns in scheduling decisions
    4. Bias future generations toward learned patterns
    """
    
    def __init__(self):
        # Store historical schedules (chromosome, fitness)
        self.history: List[Tuple[Chromosome, float]] = []
        
        # Pattern frequency tracking
        self.course_faculty_patterns: Dict[str, int] = defaultdict(int)
        self.course_timeslot_patterns: Dict[str, int] = defaultdict(int)
        self.course_room_patterns: Dict[str, int] = defaultdict(int)
        self.faculty_timeslot_patterns: Dict[str, int] = defaultdict(int)
        
        # Combination patterns (more complex)
        self.triple_patterns: Dict[str, int] = defaultdict(int)  # course-faculty-timeslot
        
        logger.info("Learning engine initialized")
    
    def add_schedule(self, genes: List[Gene], fitness: float):
        """
        Add a successful schedule to learning history
        Extract and store patterns
        """
        chromosome = Chromosome(genes)
        chromosome.fitness = fitness
        
        self.history.append((chromosome, fitness))
        
        # Extract patterns from this schedule
        for gene in genes:
            # Track individual associations
            course_faculty_key = f"{gene.course_id}_{gene.faculty_id}"
            course_timeslot_key = f"{gene.course_id}_{gene.timeslot_id}"
            course_room_key = f"{gene.course_id}_{gene.room_id}"
            faculty_timeslot_key = f"{gene.faculty_id}_{gene.timeslot_id}"
            
            # Weight by fitness - better schedules have more influence
            weight = int(fitness * 10)  # Convert 0.0-1.0 to 0-10
            
            self.course_faculty_patterns[course_faculty_key] += weight
            self.course_timeslot_patterns[course_timeslot_key] += weight
            self.course_room_patterns[course_room_key] += weight
            self.faculty_timeslot_patterns[faculty_timeslot_key] += weight
            
            # Track triple patterns (more specific)
            triple_key = f"{gene.course_id}_{gene.faculty_id}_{gene.timeslot_id}"
            self.triple_patterns[triple_key] += weight
        
        logger.info(
            f"Learned from schedule with fitness {fitness:.4f}. "
            f"Total history: {len(self.history)}"
        )
    
    def get_pattern_score(self, gene: Gene) -> float:
        """
        Calculate how well a gene matches learned patterns
        Higher score = more aligned with historical success
        """
        score = 0.0
        
        # Check various pattern matches
        course_faculty_key = f"{gene.course_id}_{gene.faculty_id}"
        course_timeslot_key = f"{gene.course_id}_{gene.timeslot_id}"
        course_room_key = f"{gene.course_id}_{gene.room_id}"
        faculty_timeslot_key = f"{gene.faculty_id}_{gene.timeslot_id}"
        triple_key = f"{gene.course_id}_{gene.faculty_id}_{gene.timeslot_id}"
        
        # Add pattern scores (normalized)
        score += self.course_faculty_patterns.get(course_faculty_key, 0) / 100.0
        score += self.course_timeslot_patterns.get(course_timeslot_key, 0) / 100.0
        score += self.course_room_patterns.get(course_room_key, 0) / 100.0
        score += self.faculty_timeslot_patterns.get(faculty_timeslot_key, 0) / 100.0
        
        # Triple pattern is most valuable
        score += self.triple_patterns.get(triple_key, 0) / 50.0
        
        return score
    
    def get_best_faculty_for_course(self, course_id: str, top_n: int = 3) -> List[str]:
        """
        Get most frequently used faculty for a course
        """
        pattern_scores = {}
        
        for pattern, count in self.course_faculty_patterns.items():
            parts = pattern.split('_')
            if parts[0] == course_id:
                faculty_id = parts[1]
                pattern_scores[faculty_id] = count
        
        # Sort by count and return top N
        sorted_faculty = sorted(
            pattern_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [faculty_id for faculty_id, _ in sorted_faculty[:top_n]]
    
    def get_best_timeslot_for_course(self, course_id: str, top_n: int = 3) -> List[str]:
        """
        Get most frequently used timeslots for a course
        """
        pattern_scores = {}
        
        for pattern, count in self.course_timeslot_patterns.items():
            parts = pattern.split('_')
            if parts[0] == course_id:
                timeslot_id = parts[1]
                pattern_scores[timeslot_id] = count
        
        sorted_timeslots = sorted(
            pattern_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [timeslot_id for timeslot_id, _ in sorted_timeslots[:top_n]]
    
    def get_best_room_for_course(self, course_id: str, top_n: int = 3) -> List[str]:
        """
        Get most frequently used rooms for a course
        """
        pattern_scores = {}
        
        for pattern, count in self.course_room_patterns.items():
            parts = pattern.split('_')
            if parts[0] == course_id:
                room_id = parts[1]
                pattern_scores[room_id] = count
        
        sorted_rooms = sorted(
            pattern_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [room_id for room_id, _ in sorted_rooms[:top_n]]
    
    def create_biased_gene(self, course_id: str, 
                          available_faculty: List[str],
                          available_rooms: List[str],
                          available_timeslots: List[str]) -> Gene:
        """
        Create a gene biased toward learned patterns
        Falls back to random if no patterns exist
        """
        import random
        
        # Try to use learned patterns
        best_faculty = self.get_best_faculty_for_course(course_id, top_n=3)
        best_timeslots = self.get_best_timeslot_for_course(course_id, top_n=3)
        best_rooms = self.get_best_room_for_course(course_id, top_n=3)
        
        # Select from learned patterns if available, otherwise random
        faculty_id = (
            random.choice([f for f in best_faculty if f in available_faculty])
            if best_faculty and any(f in available_faculty for f in best_faculty)
            else random.choice(available_faculty)
        )
        
        timeslot_id = (
            random.choice([t for t in best_timeslots if t in available_timeslots])
            if best_timeslots and any(t in available_timeslots for t in best_timeslots)
            else random.choice(available_timeslots)
        )
        
        room_id = (
            random.choice([r for r in best_rooms if r in available_rooms])
            if best_rooms and any(r in available_rooms for r in best_rooms)
            else random.choice(available_rooms)
        )
        
        return Gene(
            course_id=course_id,
            faculty_id=faculty_id,
            room_id=room_id,
            timeslot_id=timeslot_id
        )
    
    def get_pattern_count(self) -> int:
        """
        Get total number of learned patterns
        """
        return (
            len(self.course_faculty_patterns) +
            len(self.course_timeslot_patterns) +
            len(self.course_room_patterns) +
            len(self.triple_patterns)
        )
    
    def get_top_patterns(self, limit: int = 10) -> List[Dict]:
        """
        Get top learned patterns for reporting
        """
        all_patterns = []
        
        # Add course-faculty patterns
        for pattern, count in sorted(
            self.course_faculty_patterns.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]:
            parts = pattern.split('_')
            all_patterns.append({
                "type": "course_faculty",
                "course": parts[0],
                "faculty": parts[1],
                "strength": count
            })
        
        # Add triple patterns
        for pattern, count in sorted(
            self.triple_patterns.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]:
            parts = pattern.split('_')
            all_patterns.append({
                "type": "course_faculty_timeslot",
                "course": parts[0],
                "faculty": parts[1],
                "timeslot": parts[2],
                "strength": count
            })
        
        return all_patterns[:limit]
    
    def clear_history(self):
        """
        Clear all learned patterns (useful for testing)
        """
        self.history.clear()
        self.course_faculty_patterns.clear()
        self.course_timeslot_patterns.clear()
        self.course_room_patterns.clear()
        self.faculty_timeslot_patterns.clear()
        self.triple_patterns.clear()
        logger.info("Learning history cleared")