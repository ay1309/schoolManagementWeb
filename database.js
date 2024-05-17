import mongoose from "mongoose";

export default class DB {

    static async connectDB(DB_URI) {
        try {
            await mongoose.connect(DB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log(`Database connected: ${DB_URI}`);
        } catch (err) {
            console.error(err.message);
            process.exit(1);
        }

        const dbConnection = mongoose.connection;

        dbConnection.on("error", (err) => {
            console.error(`Connection error: ${err}`);
        });

        return dbConnection;
    }
}
