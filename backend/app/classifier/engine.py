import re
from typing import Dict, Any, List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from app.classifier.training_corpus import TRAINING_CORPUS, KEYWORD_RULES


class GrievanceClassifier:
    def __init__(self):
        self.rules = KEYWORD_RULES
        self._ml_pipeline = None
        self._train_model()

    def _train_model(self):
        texts = [item[0] for item in TRAINING_CORPUS]
        labels = [f"{item[1]}::{item[2]}" for item in TRAINING_CORPUS]
        self._ml_pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), stop_words="english")),
            ("clf", MultinomialNB(alpha=0.1))
        ])
        self._ml_pipeline.fit(texts, labels)

    def classify(self, title: str, description: str) -> Dict[str, Any]:
        combined_text = f"{title} {description}".lower()
        
        # 1. Rule-based evaluation
        rule_result = self._apply_rules(combined_text)
        if rule_result["confidence"] >= 0.65:
            return rule_result

        # 2. Machine Learning TF-IDF fallback
        ml_result = self._apply_ml(combined_text)
        if ml_result["confidence"] > rule_result["confidence"]:
            return ml_result

        # Fallback to the higher confidence of the two
        return rule_result if rule_result["confidence"] > 0 else ml_result

    def _apply_rules(self, text: str) -> Dict[str, Any]:
        best_dept = None
        best_dept_score = 0
        all_matched_keywords = []

        for dept_code, data in self.rules.items():
            dept_matches = [kw for kw in data["keywords"] if re.search(r'\b' + re.escape(kw) + r'\b', text)]
            dept_score = len(dept_matches)
            if dept_score > best_dept_score:
                best_dept_score = dept_score
                best_dept = dept_code
                all_matched_keywords = dept_matches

        if not best_dept or best_dept_score == 0:
            return {
                "department_code": "ROADS",
                "category_name": "Pothole / Road Damage",
                "confidence": 0.0,
                "method": "RULE_BASED",
                "matched_keywords": []
            }

        # Resolve sub-category within best department
        dept_info = self.rules[best_dept]
        best_category = dept_info["default_category"]
        best_cat_matches = 0

        for cat_name, cat_kws in dept_info.get("category_keywords", {}).items():
            cat_matches = sum(1 for kw in cat_kws if re.search(r'\b' + re.escape(kw) + r'\b', text))
            if cat_matches > best_cat_matches:
                best_cat_matches = cat_matches
                best_category = cat_name

        confidence = min(0.95, 0.5 + (best_dept_score * 0.15) + (best_cat_matches * 0.1))

        return {
            "department_code": best_dept,
            "category_name": best_category,
            "confidence": round(confidence, 2),
            "method": "RULE_BASED",
            "matched_keywords": all_matched_keywords
        }

    def _apply_ml(self, text: str) -> Dict[str, Any]:
        if not self._ml_pipeline:
            return {
                "department_code": "ROADS",
                "category_name": "Pothole / Road Damage",
                "confidence": 0.0,
                "method": "TF_IDF_ML",
                "matched_keywords": []
            }

        probs = self._ml_pipeline.predict_proba([text])[0]
        max_idx = probs.argmax()
        label = self._ml_pipeline.classes_[max_idx]
        dept_code, cat_name = label.split("::", 1)
        confidence = float(probs[max_idx])

        return {
            "department_code": dept_code,
            "category_name": cat_name,
            "confidence": round(confidence, 2),
            "method": "TF_IDF_ML",
            "matched_keywords": []
        }


# Singleton instance
classifier_engine = GrievanceClassifier()
