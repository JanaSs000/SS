const { connectDB } = require("./db");

module.exports = function () {

    async function collection() {
        const db = await connectDB();
        return db.collection("published");
    }

    return {
        async getAllPublished() {
            const col = await collection();
            const docs = await col.find({}).toArray();
            return Object.fromEntries(docs.map(d => [d._id, d]));
        },

        async publishOutfit(id, outfit) {
            const col = await collection();
            const _id = id || Date.now().toString();

            await col.updateOne(
                { _id },
                {
                    $set: {
                        ...outfit,
                        likes: outfit.likes || 0,
                        dislikes: outfit.dislikes || 0
                    }
                },
                { upsert: true }
            );

            return _id;
        },

        async deletePublished(id) {
            const col = await collection();
            await col.deleteOne({ _id: id });
        },

        async like(id) {
            const col = await collection();
            await col.updateOne({ _id: id }, { $inc: { likes: 1 } });
        },

        async dislike(id) {
            const col = await collection();
            await col.updateOne({ _id: id }, { $inc: { dislikes: 1 } });
        }
    };
};
