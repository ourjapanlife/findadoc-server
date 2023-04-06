import { initializeDb } from './database'


const seedDatabase = () => {
    const args = process.argv

    initializeDb()


    //create new tables and submit the seed data. for now just the two tables are fine

    // healthcareProfs are stored as ids in Facilities and must be hydrated on load
    // when saving, the field must be stripped into just the ids

    // then create read / update / delete for fireStore

    // look into auth
}






