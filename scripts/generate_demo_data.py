import os
import csv
import random
from datetime import datetime, timedelta

# Deterministic random seed for reproducibility
random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

INFLUENCERS_DATA = [
    {"name": "Aarav Sharma", "handle": "aarav_tech", "platform": "YOUTUBE", "niche": "Tech", "followers": 450000, "score": 92.5, "base_cpm": 320, "base_roas": 3.8},
    {"name": "Priya Patel", "handle": "priya_style", "platform": "INSTAGRAM", "niche": "Fashion", "followers": 320000, "score": 88.0, "base_cpm": 260, "base_roas": 3.2},
    {"name": "Rohan Verma", "handle": "rohan_fitness", "platform": "INSTAGRAM", "niche": "Fitness", "followers": 210000, "score": 85.5, "base_cpm": 220, "base_roas": 2.9},
    {"name": "Ananya Sen", "handle": "ananya_beauty", "platform": "INSTAGRAM", "niche": "Beauty", "followers": 580000, "score": 91.0, "base_cpm": 300, "base_roas": 4.1},
    {"name": "Vikram Malhotra", "handle": "vikram_wealth", "platform": "YOUTUBE", "niche": "Finance", "followers": 390000, "score": 94.0, "base_cpm": 450, "base_roas": 4.5},
    {"name": "Sneha Roy", "handle": "sneha_eats", "platform": "INSTAGRAM", "niche": "Food & Lifestyle", "followers": 180000, "score": 82.0, "base_cpm": 210, "base_roas": 2.4},
    {"name": "Kabir Mehta", "handle": "kabir_gadgets", "platform": "YOUTUBE", "niche": "Tech", "followers": 620000, "score": 89.5, "base_cpm": 360, "base_roas": 3.6},
    {"name": "Ishita Rao", "handle": "ishita_daily", "platform": "TIKTOK", "niche": "Lifestyle", "followers": 750000, "score": 79.0, "base_cpm": 180, "base_roas": 2.1},
    {"name": "Tanmay Deshmukh", "handle": "tanmay_fin", "platform": "YOUTUBE", "niche": "Finance", "followers": 290000, "score": 90.0, "base_cpm": 420, "base_roas": 3.9},
    {"name": "Diya Nair", "handle": "diya_fits", "platform": "INSTAGRAM", "niche": "Fitness", "followers": 160000, "score": 84.0, "base_cpm": 240, "base_roas": 2.7},
    {"name": "Karan Kapoor", "handle": "karan_vlogs", "platform": "TIKTOK", "niche": "Entertainment", "followers": 920000, "score": 76.5, "base_cpm": 160, "base_roas": 1.9},
    {"name": "Meera Joshi", "handle": "meera_glam", "platform": "INSTAGRAM", "niche": "Beauty", "followers": 410000, "score": 87.0, "base_cpm": 280, "base_roas": 3.4},
]

CAMPAIGNS_DATA = [
    {
        "name": "Diwali Mega Festive Sale 2026",
        "objective": "CONVERSIONS",
        "platform": "MULTI",
        "start_date": "2026-08-01",
        "end_date": "2026-10-31",
        "budget": 3500000.0,
        "currency": "INR",
        "status": "ACTIVE",
    },
    {
        "name": "Summer Product Launch Campaign",
        "objective": "REVENUE",
        "platform": "MULTI",
        "start_date": "2026-05-01",
        "end_date": "2026-07-31",
        "budget": 2000000.0,
        "currency": "INR",
        "status": "COMPLETED",
    },
    {
        "name": "Monsoon Brand Awareness Blitz",
        "objective": "AWARENESS",
        "platform": "INSTAGRAM",
        "start_date": "2026-07-01",
        "end_date": "2026-08-31",
        "budget": 1200000.0,
        "currency": "INR",
        "status": "COMPLETED",
    },
]


def generate_influencers_csv():
    filepath = os.path.join(DATA_DIR, "sample_influencers.csv")
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "handle", "platform", "niche", "follower_count", "audience_quality_score"])
        for inf in INFLUENCERS_DATA:
            writer.writerow([
                inf["name"],
                inf["handle"],
                inf["platform"],
                inf["niche"],
                inf["followers"],
                inf["score"]
            ])
    print(f"Generated {filepath}")


def generate_campaigns_csv():
    filepath = os.path.join(DATA_DIR, "sample_campaigns.csv")
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "objective", "platform", "start_date", "end_date", "allocated_budget", "currency", "status"])
        for c in CAMPAIGNS_DATA:
            writer.writerow([
                c["name"],
                c["objective"],
                c["platform"],
                c["start_date"],
                c["end_date"],
                c["budget"],
                c["currency"],
                c["status"]
            ])
    print(f"Generated {filepath}")


def generate_performance_csv():
    filepath = os.path.join(DATA_DIR, "sample_performance.csv")
    start_date = datetime(2026, 8, 1)
    days_count = 75  # 75 days of performance

    records = []
    for day_i in range(days_count):
        cur_date = (start_date + timedelta(days=day_i)).strftime("%Y-%m-%d")

        for inf in INFLUENCERS_DATA:
            # Active in primary campaign
            camp = CAMPAIGNS_DATA[0]["name"]
            
            # Daily spend with realistic variance and weekend bumps
            day_of_week = (start_date + timedelta(days=day_i)).weekday()
            multiplier = 1.25 if day_of_week in (4, 5, 6) else 0.95
            
            base_daily_spend = random.uniform(2500, 7500) * multiplier
            spend = round(base_daily_spend, 2)

            # Impressions based on CPM
            cpm = inf["base_cpm"] * random.uniform(0.9, 1.1)
            impressions = int((spend / cpm) * 1000)
            reach = int(impressions * random.uniform(0.72, 0.88))
            
            # Funnel hierarchy: impressions >= reach >= engagements >= clicks >= conversions
            eng_rate = (inf["score"] / 100.0) * random.uniform(0.035, 0.055)
            engagements = int(impressions * eng_rate)
            
            ctr = random.uniform(0.015, 0.032)
            clicks = int(impressions * ctr)
            if clicks < 1:
                clicks = random.randint(10, 30)

            cvr = random.uniform(0.025, 0.048) * (inf["score"] / 85.0)
            conversions = int(clicks * cvr)
            if conversions > clicks:
                conversions = max(1, int(clicks * 0.5))

            # Attributed revenue using diminishing returns model
            # Base ROAS varies slightly with noise
            roas_noise = random.uniform(0.85, 1.15)
            # Saturation effect: when spend is high, return rate slows down
            diminish_factor = 1.0 / (1.0 + 0.000008 * spend)
            expected_revenue = spend * inf["base_roas"] * roas_noise * diminish_factor
            attributed_revenue = round(max(0.0, expected_revenue), 2)

            records.append({
                "campaign_name": camp,
                "influencer_handle": inf["handle"],
                "platform": inf["platform"],
                "date": cur_date,
                "spend": spend,
                "impressions": impressions,
                "reach": reach,
                "engagements": engagements,
                "clicks": clicks,
                "conversions": conversions,
                "attributed_revenue": attributed_revenue
            })

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "campaign_name", "influencer_handle", "platform", "date",
            "spend", "impressions", "reach", "engagements", "clicks",
            "conversions", "attributed_revenue"
        ])
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated {filepath} with {len(records)} daily performance records.")


if __name__ == "__main__":
    generate_influencers_csv()
    generate_campaigns_csv()
    generate_performance_csv()
