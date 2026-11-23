import logging
from datetime import datetime, date, timedelta
from passlib.context import CryptContext
from backend.app.database.session import engine, SessionLocal, Base
from backend.app.models.users import Role, User
from backend.app.models.geography import District, Village
from backend.app.models.agriculture import (
    Crop,
    CropGrowthStage,
    Disease,
    AgriculturalOfficer,
    Farmer,
    Farm,
)
from backend.app.models.monitoring import (
    WeatherObservation,
    FarmerReport,
    DiseaseIncident,
)
from backend.app.models.intelligence import (
    VillageRiskAssessment,
    Alert,
    Recommendation,
    MLModelVersion,
)

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def init_db():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified.")

    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Role).first():
            logger.info("Database already initialized with seed data.")
            return

        logger.info("Seeding initial AgriShield data...")

        # 1. Roles
        admin_role = Role(name="ADMIN", description="Platform Administrator")
        officer_role = Role(name="OFFICER", description="State Agricultural Officer / Extension Specialist")
        farmer_role = Role(name="FARMER", description="Registered Farmer")
        researcher_role = Role(name="RESEARCHER", description="Agronomist & Spatial Data Researcher")
        db.add_all([admin_role, officer_role, farmer_role, researcher_role])
        db.flush()

        # 2. Users
        admin_user = User(
            email="admin@agrishield.gov.in",
            username="admin",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Dr. Anil Deshmukh",
            phone_number="+91-9823011223",
            is_active=True,
            is_superuser=True,
            role_id=admin_role.id,
        )
        officer_user = User(
            email="officer.yavatmal@agrishield.gov.in",
            username="officer_yavatmal",
            hashed_password=get_password_hash("Officer@123"),
            full_name="Pooja Kulkarni",
            phone_number="+91-9876543210",
            is_active=True,
            role_id=officer_role.id,
        )
        db.add_all([admin_user, officer_user])
        db.flush()

        # 3. Agricultural Officer profile
        officer_profile = AgriculturalOfficer(
            user_id=officer_user.id,
            badge_number="MH-AGR-YVT-042",
            jurisdiction_district="Yavatmal",
            department="Divisional Joint Director of Agriculture, Amravati Division",
        )
        db.add(officer_profile)
        db.flush()

        # 4. Crops and Stages
        cotton_crop = Crop(
            name="Cotton",
            scientific_name="Gossypium hirsutum (Bt Cotton)",
            category="Fiber & Cash Crop",
            description="Long-staple Bt Cotton widely cultivated in Vidarbha and Marathwada, Maharashtra.",
        )
        db.add(cotton_crop)
        db.flush()

        stages_data = [
            ("Seedling", 1, 20, "Emergence to 4 true leaves. Vulnerable to Rhizoctonia root rot.", 0.9),
            ("Vegetative", 2, 35, "Rapid vegetative development and branching.", 0.7),
            ("Squaring", 3, 25, "Floral bud (square) appearance. Critical period for sucking pests.", 1.2),
            ("Flowering", 4, 30, "Peak bloom. Highest susceptibility to Pink Bollworm oviposition.", 1.6),
            ("Boll Formation", 5, 40, "Green bolls maturing. Maximum damage impact from bollworms.", 1.8),
            ("Maturity", 6, 25, "Boll bursting and fiber harvest.", 0.8),
        ]
        for s_name, order, dur, desc, mult in stages_data:
            c_stage = CropGrowthStage(
                crop_id=cotton_crop.id,
                stage_name=s_name,
                stage_order=order,
                duration_days=dur,
                description=desc,
                susceptibility_multiplier=mult,
            )
            db.add(c_stage)

        # 5. Diseases
        diseases_data = [
            (
                "Pink Bollworm",
                "Insect / Pest",
                23.0, 32.0, 70.0,
                "Pectinophora gossypiella - destructive caterpillar boring into cotton squares and bolls, causing locule damage and double seeds.",
                "Rosetted flowers, bored pinholes in green bolls, premature boll drop, lint staining."
            ),
            (
                "Cotton Leaf Curl Virus",
                "Virus (Begomovirus)",
                26.0, 35.0, 65.0,
                "Transmitted by whitefly (Bemisia tabaci). Systemic viral infection causing severe stunted vegetative architecture.",
                "Upward/downward leaf curling, vein thickening, enation (leaf-like outgrowths) on lower leaf surface."
            ),
            (
                "Bacterial Blight",
                "Bacterial (Xanthomonas)",
                25.0, 31.0, 80.0,
                "Xanthomonas citri pv. malvacearum. Attacks leaves, stems, and bolls in wet, windy conditions.",
                "Water-soaked angular leaf spots bound by veinlets, black arm lesions on petioles, boll rot."
            ),
            (
                "Grey Mildew",
                "Fungus (Ramularia)",
                20.0, 28.0, 85.0,
                "Ramularia areola. Prevalent under prolonged cloudy weather and cool humid mornings.",
                "White powdery angular patches on lower foliage leading to premature leaf defoliation."
            ),
        ]
        disease_objs = {}
        for d_name, p_type, t_min, t_max, h_min, d_desc, d_symp in diseases_data:
            d_obj = Disease(
                crop_id=cotton_crop.id,
                name=d_name,
                pathogen_type=p_type,
                optimal_temp_min=t_min,
                optimal_temp_max=t_max,
                optimal_humidity_min=h_min,
                description=d_desc,
                symptoms=d_symp,
            )
            db.add(d_obj)
            db.flush()
            disease_objs[d_name] = d_obj

        # 6. Maharashtra Cotton Belt Districts & Real Villages
        districts_data = [
            ("Yavatmal", 20.3888, 78.1204),
            ("Wardha", 20.7453, 78.6022),
            ("Amravati", 20.9374, 77.7796),
            ("Jalgaon", 21.0077, 75.5626),
            ("Akola", 20.7002, 77.0082),
            ("Chhatrapati Sambhaji Nagar", 19.8762, 75.3433),
            ("Nanded", 19.1383, 77.3210),
        ]
        district_objs = {}
        for dist_name, lat, lon in districts_data:
            dist = District(name=dist_name, state="Maharashtra", latitude=lat, longitude=lon)
            db.add(dist)
            db.flush()
            district_objs[dist_name] = dist

        villages_data = [
            # Yavatmal
            ("Babhulgaon", "MH-YVT-001", "Yavatmal", 20.5501, 78.3302, 1420.0, 980.0, 78.4, "Critical", "Pink Bollworm"),
            ("Kalamb", "MH-YVT-002", "Yavatmal", 20.4431, 78.3411, 1250.0, 820.0, 68.2, "High", "Pink Bollworm"),
            ("Darwha", "MH-YVT-003", "Yavatmal", 20.3167, 77.7667, 1890.0, 1150.0, 42.5, "Moderate", "Bacterial Blight"),
            ("Pusad", "MH-YVT-004", "Yavatmal", 19.9100, 77.5800, 2100.0, 1400.0, 21.0, "Low", "None"),
            ("Ghatanji", "MH-YVT-005", "Yavatmal", 20.1333, 78.3167, 1600.0, 1100.0, 62.1, "High", "Pink Bollworm"),
            
            # Wardha
            ("Deoli", "MH-WRD-001", "Wardha", 20.6600, 78.4800, 1340.0, 920.0, 72.8, "High", "Pink Bollworm"),
            ("Hinganghat", "MH-WRD-002", "Wardha", 20.5500, 78.8300, 1950.0, 1300.0, 48.0, "Moderate", "Cotton Leaf Curl Virus"),
            ("Seloo", "MH-WRD-003", "Wardha", 20.8300, 78.7100, 1100.0, 750.0, 18.5, "Low", "None"),
            ("Arvi", "MH-WRD-004", "Wardha", 20.9800, 78.2300, 1450.0, 980.0, 34.0, "Moderate", "Bacterial Blight"),
            
            # Amravati
            ("Achalpur", "MH-AMT-001", "Amravati", 21.2570, 77.5080, 1780.0, 1200.0, 81.6, "Critical", "Bacterial Blight"),
            ("Chandur Railway", "MH-AMT-002", "Amravati", 20.8167, 77.9667, 1310.0, 890.0, 56.4, "High", "Grey Mildew"),
            ("Morshi", "MH-AMT-003", "Amravati", 21.3200, 78.0100, 1550.0, 1020.0, 24.0, "Low", "None"),
            
            # Jalgaon
            ("Chopda", "MH-JLG-001", "Jalgaon", 21.2500, 75.3000, 2200.0, 1600.0, 59.0, "High", "Pink Bollworm"),
            ("Jamner", "MH-JLG-002", "Jalgaon", 20.8100, 75.7700, 1820.0, 1250.0, 38.0, "Moderate", "Cotton Leaf Curl Virus"),
            ("Raver", "MH-JLG-003", "Jalgaon", 21.2400, 75.9200, 1640.0, 1100.0, 19.5, "Low", "None"),
            
            # Akola
            ("Murtizapur", "MH-AKL-001", "Akola", 20.7300, 77.3700, 1690.0, 1150.0, 64.7, "High", "Pink Bollworm"),
            ("Telhara", "MH-AKL-002", "Akola", 21.0300, 76.8400, 1480.0, 980.0, 31.2, "Moderate", "Grey Mildew"),
            
            # Chhatrapati Sambhaji Nagar
            ("Gangapur", "MH-CSN-001", "Chhatrapati Sambhaji Nagar", 19.7000, 75.0100, 1560.0, 1050.0, 44.0, "Moderate", "Cotton Leaf Curl Virus"),
            ("Paithan", "MH-CSN-002", "Chhatrapati Sambhaji Nagar", 19.4800, 75.3800, 1720.0, 1180.0, 22.8, "Low", "None"),
            
            # Nanded
            ("Kinwat", "MH-NED-001", "Nanded", 19.6300, 78.2000, 1850.0, 1220.0, 76.2, "Critical", "Pink Bollworm"),
            ("Degloor", "MH-NED-002", "Nanded", 18.5500, 77.5800, 1390.0, 920.0, 36.5, "Moderate", "Bacterial Blight"),
        ]

        village_objs = []
        for v_name, code, d_name, lat, lon, total_ha, cotton_ha, risk_score, risk_cat, dominant_threat in villages_data:
            v_obj = Village(
                name=v_name,
                code=code,
                district_id=district_objs[d_name].id,
                latitude=lat,
                longitude=lon,
                total_cultivated_area_ha=total_ha,
                cotton_cultivated_area_ha=cotton_ha,
            )
            db.add(v_obj)
            db.flush()
            village_objs.append(v_obj)

            # Add Village Risk Assessment
            assessment = VillageRiskAssessment(
                village_id=v_obj.id,
                assessment_date=date.today(),
                overall_risk_score=risk_score,
                risk_category=risk_cat,
                dominant_threat_disease=dominant_threat,
                weather_risk_score=min(100.0, risk_score * 0.9 + 5),
                spatial_proximity_score=min(100.0, risk_score * 1.05),
                crop_vulnerability_score=85.0 if risk_cat in ["High", "Critical"] else 45.0,
                key_drivers=[
                    f"7-day relative humidity > 78% creates microclimate for {dominant_threat}",
                    f"Crop in peak flowering/boll stage in {v_name}",
                    "Proximity to positive trap catches and verified farmer field observations",
                ] if risk_score > 40 else ["Favorable dry weather conditions", "Low pest population density"],
                recommended_action=f"Mandatory pheromone trap monitoring and destructive rosette sampling in {v_name}." if risk_score > 50 else "Maintain routine bi-weekly field scouting."
            )
            db.add(assessment)

            # Weather observations (Current + past 7 days)
            for day_offset in range(7, -1, -1):
                obs_date = date.today() - timedelta(days=day_offset)
                temp = 29.5 - (day_offset * 0.2) + (1.2 if v_name == "Babhulgaon" else 0.0)
                rh = 75.0 + (day_offset * 0.8) if risk_cat in ["High", "Critical"] else 55.0 + day_offset
                rain = 18.5 if (day_offset in [1, 2] and risk_cat in ["High", "Critical"]) else 0.0

                w_obs = WeatherObservation(
                    village_id=v_obj.id,
                    observation_date=obs_date,
                    temperature_c=round(temp, 1),
                    relative_humidity_pct=round(rh, 1),
                    rainfall_mm=round(rain, 1),
                    wind_speed_kmh=12.5,
                    temp_avg_3d=round(temp, 1),
                    temp_avg_7d=round(temp - 0.5, 1),
                    humidity_avg_3d=round(rh, 1),
                    humidity_avg_7d=round(rh - 2.0, 1),
                    cumulative_rainfall_7d=round(rain * 2.5, 1),
                    conducive_weather_index=round(risk_score / 100.0, 2),
                )
                db.add(w_obs)

            # If High or Critical, generate Alert
            if risk_score > 60.0:
                alert = Alert(
                    village_id=v_obj.id,
                    crop="Cotton",
                    suspected_disease=dominant_threat,
                    risk_probability=round(risk_score / 100.0, 2),
                    risk_category=risk_cat,
                    contributing_factors=[
                        f"Cumulative rainfall of 37mm with 84% relative humidity over 7 days in {v_name}",
                        "Crop phenology at vulnerable flowering and green boll formation stage",
                        "Confirmed field observations within 12km radius"
                    ],
                    recommended_inspection=f"Deploy 5 pheromone traps per hectare in {v_name}. Scout 20 randomly selected plants for rosette flowers.",
                    preventive_actions="Install light traps at field borders, remove and destroy rosetted flowers, avoid excessive nitrogenous fertilizers.",
                    status="ACTIVE",
                    alert_timestamp=datetime.utcnow() - timedelta(hours=int(risk_score % 12)),
                )
                db.add(alert)

        # 7. Sample Farmers & Farms
        farmers_data = [
            ("Rameshwar Patil", "FMR-MH-001", "+91-9850123456", "Babhulgaon", 3.5, 20.5510, 78.3320),
            ("Suresh Jadhav", "FMR-MH-002", "+91-9850234567", "Kalamb", 2.8, 20.4450, 78.3430),
            ("Gajanan Rathod", "FMR-MH-003", "+91-9850345678", "Achalpur", 4.2, 21.2580, 77.5100),
            ("Maroti Shinde", "FMR-MH-004", "+91-9850456789", "Deoli", 3.0, 20.6620, 78.4820),
            ("Dnyaneshwar Gawande", "FMR-MH-005", "+91-9850567890", "Kinwat", 5.0, 19.6320, 78.2020),
            ("Pandurang Bhosle", "FMR-MH-006", "+91-9850678901", "Chopda", 3.2, 21.2520, 75.3020),
            ("Eknath Khade", "FMR-MH-007", "+91-9850789012", "Darwha", 2.5, 20.3180, 77.7680),
            ("Balaji Madavi", "FMR-MH-008", "+91-9850890123", "Ghatanji", 2.0, 20.1350, 78.3180),
        ]
        farmer_objs = []
        for f_name, f_code, phone, v_name, area, f_lat, f_lon in farmers_data:
            target_v = next(v for v in village_objs if v.name == v_name)
            farmer = Farmer(
                farmer_id_code=f_code,
                name=f_name,
                contact_number=phone,
                village_id=target_v.id,
                total_land_area_ha=area,
            )
            db.add(farmer)
            db.flush()
            farmer_objs.append((farmer, target_v))

            farm = Farm(
                farmer_id=farmer.id,
                village_id=target_v.id,
                crop_id=cotton_crop.id,
                survey_number=f"Gat No. {100 + len(farmer_objs)}",
                area_hectares=area * 0.8,
                soil_type="Black Cotton Soil (Deep Regur)",
                current_growth_stage="Flowering",
                latitude=f_lat,
                longitude=f_lon,
            )
            db.add(farm)

        # 8. Sample Farmer Disease Reports
        reports_data = [
            (
                farmer_objs[0][0], farmer_objs[0][1], disease_objs["Pink Bollworm"], "Flowering",
                "Observed multiple rosetted flowers in sector 4. Upon dissecting green bolls, spotted small pink caterpillars.",
                18.0, "High", "VERIFIED", "Field confirmed by Agri Officer. Pheromone trap catch > 8 moths/trap/night."
            ),
            (
                farmer_objs[1][0], farmer_objs[1][1], disease_objs["Pink Bollworm"], "Squaring",
                "Square drop noticed after 2 consecutive days of rain. Bored pinholes visible at base.",
                12.5, "Moderate", "VERIFIED", "Early square borer damage confirmed. Advised immediate installation of lures."
            ),
            (
                farmer_objs[2][0], farmer_objs[2][1], disease_objs["Bacterial Blight"], "Flowering",
                "Water soaked spots on leaves turning brown and angular. Some stems showing black arm symptoms.",
                22.0, "High", "VERIFIED", "Severe Xanthomonas angular leaf spot due to cloudy humid weather."
            ),
            (
                farmer_objs[3][0], farmer_objs[3][1], disease_objs["Pink Bollworm"], "Boll Formation",
                "Premature opening of bolls with stained lint and rotting locules.",
                15.0, "High", "PENDING", None
            ),
            (
                farmer_objs[4][0], farmer_objs[4][1], disease_objs["Cotton Leaf Curl Virus"], "Vegetative",
                "Leaves curled upward and thickened with yellowing margins. High population of whiteflies underneath.",
                25.0, "High", "VERIFIED", "Begomovirus vector presence confirmed. Isolation advised."
            ),
            (
                farmer_objs[6][0], farmer_objs[6][1], disease_objs["Grey Mildew"], "Flowering",
                "White powdery spots on lower leaves with yellow halos.",
                8.0, "Low", "PENDING", None
            ),
        ]
        for f, v, d, stage, symp, pct, sev, stat, notes in reports_data:
            rep = FarmerReport(
                farmer_id=f.id,
                village_id=v.id,
                crop_name="Cotton",
                suspected_disease_id=d.id if d else None,
                crop_growth_stage=stage,
                observation_date=date.today() - timedelta(days=2),
                symptoms=symp,
                affected_plants_pct=pct,
                severity=sev,
                latitude=v.latitude + 0.005,
                longitude=v.longitude + 0.005,
                status=stat,
                officer_review_notes=notes,
                reviewed_by_id=officer_profile.id if stat == "VERIFIED" else None,
            )
            db.add(rep)

        # 9. Recommendations (ICAR-CICR Traceable)
        recs_data = [
            (
                disease_objs["Pink Bollworm"].id, "Flowering", "Critical", "FIELD_INSPECTION",
                "Intensive Pheromone Trap Installation & Destructive Sampling",
                "Install 5 sleeve/funnel pheromone traps per hectare charged with Gossyplure. Destructively inspect 20 green bolls (20-25 days old) across the diagonal. If ETL exceeds 8 moths/trap for 3 consecutive days or 10% green boll damage with live larvae, trigger emergency bio-control protocol.",
                "ICAR - Central Institute for Cotton Research (CICR) Nagpur Advisory Bulletin"
            ),
            (
                disease_objs["Pink Bollworm"].id, "Flowering", "High", "BIOCONTROL",
                "Release of Trichogramma bactrae Egg Parasitoids",
                "Undertake weekly inundative releases of Trichogramma bactrae parasitoid egg cards @ 1,50,000 parasitized eggs/ha starting from 45 days after sowing. Deploy during late afternoon hours to minimize heat desiccation.",
                "ICAR-CICR Biological Pest Management Guidelines"
            ),
            (
                disease_objs["Bacterial Blight"].id, "Flowering", "Critical", "CULTURAL_PRACTICE",
                "Canopy Aeration and Drainage Management",
                "Ensure strict drainage of stagnant water in black cotton soils. Avoid overhead irrigation and excess urea application, which induces succulent leaf tissue favored by Xanthomonas malvacearum.",
                "Dr. Panjabrao Deshmukh Krishi Vidyapeeth (PDKV) Akola Disease Management Guide"
            ),
            (
                disease_objs["Cotton Leaf Curl Virus"].id, "Vegetative", "High", "PREVENTIVE",
                "Yellow Sticky Trap Barrier & Whitefly Vector Suppression",
                "Erect yellow sticky cards (15-20 traps/ha) at crop canopy level to monitor and mass trap whitefly vectors. Roguing and destruction of enation-bearing plants to arrest virus transmission.",
                "Directorate of Cotton Development, Government of India"
            ),
            (
                disease_objs["Grey Mildew"].id, "Flowering", "Moderate", "CULTURAL_PRACTICE",
                "Lower Leaf Sanitation & Plant Spacing",
                "Remove and bury infected senescent bottom foliage showing powdery Ramularia patches to limit ascospore propagation. Maintain inter-row weed clearance for adequate sunlight penetration.",
                "ICAR-CICR Grey Mildew Management Advisory"
            ),
        ]
        for d_id, stage, risk_cat, r_type, title, text_g, src in recs_data:
            rec = Recommendation(
                disease_id=d_id,
                growth_stage=stage,
                risk_category=risk_cat,
                recommendation_type=r_type,
                title=title,
                guidance_text=text_g,
                scientific_basis=src,
                is_expert_reviewed=True,
            )
            db.add(rec)

        db.commit()
        logger.info("AgriShield database successfully seeded with Maharashtra cotton intelligence dataset.")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
