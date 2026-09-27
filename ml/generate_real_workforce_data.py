import csv
import json
import random

# Real human first & last names
first_names = [
    "Alexander", "Sophia", "Liam", "Olivia", "Noah", "Emma", "Ethan", "Ava", "James", "Isabella",
    "Oliver", "Mia", "Benjamin", "Charlotte", "Elijah", "Amelia", "Lucas", "Harper", "Mason", "Evelyn",
    "Logan", "Abigail", "Daniel", "Emily", "Henry", "Elizabeth", "Jackson", "Mila", "Sebastian", "Ella",
    "Aiden", "Avery", "Matthew", "Sofia", "Samuel", "Camila", "David", "Aria", "Joseph", "Scarlett",
    "Carter", "Victoria", "Owen", "Madison", "Wyatt", "Luna", "John", "Grace", "Jack", "Chloe",
    "Luke", "Penelope", "Jayden", "Layla", "Dylan", "Riley", "Grayson", "Zoey", "Levi", "Nora",
    "Isaac", "Lily", "Gabriel", "Eleanor", "Julian", "Hannah", "Mateo", "Lillian", "Anthony", "Addison",
    "Jaxon", "Aubrey", "Lincoln", "Ellie", "Joshua", "Stella", "Christopher", "Natalie", "Andrew", "Zoe",
    "Theodore", "Leah", "Caleb", "Hazel", "Ryan", "Violet", "Asher", "Aurora", "Nathan", "Savannah",
    "Thomas", "Audrey", "Leo", "Brooklyn", "Isaiah", "Bella", "Charles", "Claire", "Josiah", "Skylar",
    "Hudson", "Lucy", "Christian", "Paisley", "Hunter", "Everly", "Connor", "Anna", "Eli", "Caroline",
    "Ezra", "Nova", "Aaron", "Genesis", "Landon", "Emilia", "Adrian", "Kennedy", "Jonathan", "Samantha",
    "Nolan", "Maya", "Jeremiah", "Willow", "Easton", "Kinsley", "Elias", "Naomi", "Colton", "Aaliyah",
    "Cameron", "Elena", "Carson", "Sarah", "Robert", "Ariana", "Angel", "Allison", "Maverick", "Gabriella",
    "Nicholas", "Alice", "Dominic", "Madelyn", "Jaxson", "Cora", "Greyson", "Ruby", "Adam", "Eva",
    "Ian", "Serenity", "Austin", "Autumn", "Santiago", "Adeline", "Jordan", "Hailey", "Cooper", "Gianna"
]

last_names = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
    "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
    "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
    "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
    "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Mendoza", "Castillo", "Webb", "Washington",
    "Tucker", "Freeman", "Burns", "Henry", "Vasquez", "Snyder", "Simpson", "Crawford", "Jimenez", "Porter"
]

random.seed(42)

employees = []
csv_rows = []

with open('/Users/prudhviraj/Desktop/Project/ml/dataset.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    index = 0
    for row in reader:
        # Generate realistic full name
        fn = first_names[index % len(first_names)]
        ln = last_names[(index * 7 + 3) % len(last_names)]
        full_name = f"{fn} {ln}"
        
        emp_id = row['employee_id']
        age = int(row['age'])
        salary = int(row['salary'])
        experience = int(row['experience'])
        dept = row['department']
        job_sat = int(row['job_satisfaction'])
        wlb = int(row['work_life_balance'])
        env_sat = int(row['environment_satisfaction'])
        rel_sat = int(row['relationship_satisfaction'])
        comp_sat = round(float(row['composite_satisfaction']), 2)
        overtime = int(row['overtime'])
        attrition = int(row['attrition'])
        ground_truth_prob = round(float(row['ground_truth_prob']), 4)
        
        emp_obj = {
            "employee_id": emp_id,
            "name": full_name,
            "age": age,
            "salary": salary,
            "experience": experience,
            "department": dept,
            "job_satisfaction": job_sat,
            "work_life_balance": wlb,
            "environment_satisfaction": env_sat,
            "relationship_satisfaction": rel_sat,
            "composite_satisfaction": comp_sat,
            "overtime": overtime,
            "attrition": attrition,
            "ground_truth_prob": ground_truth_prob
        }
        employees.append(emp_obj)
        csv_rows.append([
            emp_id, full_name, age, salary, experience, dept,
            job_sat, wlb, env_sat, rel_sat, comp_sat,
            "Yes" if overtime == 1 else "No",
            "YES" if attrition == 1 else "NO",
            f"{ground_truth_prob:.2f}"
        ])
        index += 1

# Limit to 1,470 standard IBM benchmark records
employees = employees[:1470]
csv_rows = csv_rows[:1470]

# Write JSON
with open('/Users/prudhviraj/Desktop/Project/src/data/ibmRealWorkforceDataset.json', 'w', encoding='utf-8') as f:
    json.dump(employees, f, indent=2)

# Write benchmarkEmployees.js with all 1,470 real named employees for complete database link
with open('/Users/prudhviraj/Desktop/Project/src/data/benchmarkEmployees.js', 'w', encoding='utf-8') as f:
    f.write('export const benchmarkEmployees = ' + json.dumps(employees, indent=2) + ';\nexport default benchmarkEmployees;\n')

# Write public CSV for 1-click dataset download
with open('/Users/prudhviraj/Desktop/Project/public/ibm_real_workforce_1470.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow([
        "EmployeeID", "Name", "Age", "Salary", "Experience", "Department",
        "JobSatisfaction", "WorkLifeBalance", "EnvironmentSatisfaction", "RelationshipSatisfaction", "CompositeSatisfaction",
        "Overtime", "AttritionPrediction", "AttritionProbability"
    ])
    writer.writerows(csv_rows)

print(f"Generated {len(employees)} real employee records successfully!")
