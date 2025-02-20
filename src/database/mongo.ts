import mongoose from 'mongoose';



export const connectDB = async (): Promise<void> => {
  try {
    // Retrieve MongoDB credentials from a single set of environment variables.
    const username = process.env.MONGO_USERNAME;
    const password = process.env.MONGO_PASSWORD;
    const host = process.env.MONGO_HOST;
    const dbName = process.env.MONGO_DB;

    // Ensure all required credentials are provided.
    if (!username || !password || !host || !dbName) {
      console.error("Missing one or more MongoDB credentials.");
      process.exit(1);
    }

    // Construct the connection URI using the credentials.
    const uri: string = `mongodb+srv://${username}:${password}@${host}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;

    // Explicitly type options as mongoose.ConnectOptions.
    const clientOptions: mongoose.ConnectOptions = {
      serverApi: { version: "1", strict: true, deprecationErrors: true }
    };

    // Connect to MongoDB using the constructed URI and options.
    await mongoose.connect(uri, clientOptions);
    // Use the non-null assertion operator (!) to tell TypeScript that `db` is not undefined.
    await mongoose.connection.db!.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
  }
};

// If this file is run directly, connect then disconnect from MongoDB for testing.
if (require.main === module) {
  (async () => {
    await connectDB();
    await disconnectDB();
  })().catch(console.error);
}
