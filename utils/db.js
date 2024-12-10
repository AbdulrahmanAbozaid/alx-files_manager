import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    this.dbName = process.env.DB_DATABASE || 'files_manager';
    this.db = this.client.db(this.dbName);

    const uri = `mongodb://${host}:${port}`;
    this.client = new MongoClient(uri, {
      useUnifiedTopology: true,
    });

    this.connected = false;

    this.client
      .connect()
      .then(() => {
        this.connected = true;
      })
      .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
      });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    if (!this.isAlive()) {
      return 0;
    }
    const users = this.db.collection('users');
    return users.countDocuments();
  }

  async nbFiles() {
    if (!this.isAlive()) {
      return 0;
    }
    const users = this.db.collection('files');
    return users.countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
