from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.intelligence import Recommendation
from backend.app.models.agriculture import Disease

class RecommendationService:
    @staticmethod
    def get_recommendations_for_threat(
        db: Session, 
        disease_name: str, 
        growth_stage: str = "Flowering", 
        risk_category: str = "High"
    ) -> List[Recommendation]:
        """
        Retrieves traceable agronomic recommendations for a given disease and risk context.
        """
        disease = db.query(Disease).filter(Disease.name == disease_name).first()
        if not disease:
            # Fallback to any recommendations matching risk
            return db.query(Recommendation).filter(Recommendation.risk_category == risk_category).all()

        recs = (
            db.query(Recommendation)
            .filter(
                Recommendation.disease_id == disease.id,
                Recommendation.risk_category == risk_category
            )
            .all()
        )
        if not recs:
            # Fallback to general recommendations for that disease
            recs = db.query(Recommendation).filter(Recommendation.disease_id == disease.id).all()
        return recs

    @staticmethod
    def get_summary_guidance(disease_name: str, risk_category: str) -> dict:
        """
        Returns structured field inspection and preventive protocols.
        """
        protocols = {
            "Pink Bollworm": {
                "Critical": {
                    "inspection": "Inspect 20 green bolls per acre diagonally. Open green bolls to verify internal locule burrowing and pink larvae.",
                    "preventive": "Install 8-10 pheromone traps/ha with Gossyplure. Release Trichogramma bactrae egg cards @ 1.5 lakh eggs/ha weekly."
                },
                "High": {
                    "inspection": "Deploy 5 pheromone traps per ha. Check weekly for moth catches exceeding the ETL of 8 moths/trap/night.",
                    "preventive": "Handpick and destroy rosetted flowers. Avoid broad-spectrum insecticides that kill beneficial predatory chrysopids."
                },
                "Moderate": {
                    "inspection": "Randomly scout 20 plants across the field once a week during morning hours.",
                    "preventive": "Install yellow sticky traps and keep field borders free of alternate malvaceous host weeds."
                },
                "Low": {
                    "inspection": "Maintain bi-weekly routine crop scouting for flower buds.",
                    "preventive": "Maintain standard soil organic carbon and balanced NPK nutrition (avoid excess nitrogen)."
                }
            },
            "Bacterial Blight": {
                "Critical": {
                    "inspection": "Inspect lower canopy leaves and stems for angular water-soaked lesions and black-arm lesions.",
                    "preventive": "Improve surface drainage immediately to eliminate standing water in black soil furrows. Discontinue sprinkler irrigation."
                },
                "High": {
                    "inspection": "Check underside of leaves after rainfall events for translucent greasy angular spots.",
                    "preventive": "Avoid entering fields when foliage is wet to prevent bacterial transmission via clothing or implements."
                },
                "Moderate": {
                    "inspection": "Bi-weekly field walking to assess canopy airflow.",
                    "preventive": "Ensure inter-row spacing of at least 90x60cm for maximum aeration."
                },
                "Low": {
                    "inspection": "Routine observation during fertilizer application.",
                    "preventive": "Use certified disease-free seeds treated with Pseudomonas fluorescens."
                }
            }
        }
        fallback = {
            "inspection": "Conduct thorough field scouting of at least 20 plants per hectare.",
            "preventive": "Maintain clean cultivation, destroy infested crop debris, and monitor environmental humidity."
        }
        return protocols.get(disease_name, {}).get(risk_category, fallback)
