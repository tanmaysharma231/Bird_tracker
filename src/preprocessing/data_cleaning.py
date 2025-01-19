from pyspark.sql import SparkSession
from pyspark.sql.functions import col

# Initialize Spark session
spark = SparkSession.builder.appName("BirdDataCleaning").getOrCreate()

# Define file paths
input_file ="/content/drive/MyDrive/Bird_Tracker/group-project-bird-tracker-main/data/IBP-MAPS-data-exploration-results.csv"

output_file = "/content/drive/MyDrive/Bird_Tracker/group-project-bird-tracker-main/data/cleaned_data.csv"

# Load the dataset
df = spark.read.csv(input_file, header=True, inferSchema=True)

# Step 1: Drop rows with null values in any of the selected columns
df_cleaned = df.dropna(subset=["BCR_name", "CommonName", "ScientificName", "No_individuals"])

# Step 2: Select relevant columns and rename them
df_cleaned = df_cleaned.select(
    col("BCR_name").alias("BCR"),
    col("CommonName").alias("BirdName"),
    col("ScientificName").alias("BirdScientificName"),
    col("No_individuals").alias("BirdCount")
)

# Step 3: Remove rows with negative or invalid values in 'BirdCount'
df_cleaned = df_cleaned.filter(col("BirdCount") >= 0)

# Step 4: Drop duplicate rows if any
df_cleaned = df_cleaned.dropDuplicates()

# Save the cleaned data to a CSV file
df_cleaned.write.csv(output_file, header=True, mode='overwrite')

# Stop the Spark session
spark.stop()

