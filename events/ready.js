const { Events } = require('discord.js');
const mysql = require('mysql');
const db = mysql.createConnection({ host: `${process.env.DB_HOST}`, user: `${process.env.DB_USER}`, password: `${process.env.DB_PWD}`, database: `${process.env.DB_NAME}` });
module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        const status = [
            { type: 0, content: '/help' },
            { type: 0, content: '/shop' },
            { type: 0, content: '/leaderboard' },
            { type: 0, content: '/quest' },
            { type: 0, content: `${client.guilds.cache.size} servers` },
        ];
        setInterval(() => {
            const o = ~~(Math.random() * status.length);
            client.user.setPresence({ activities: [{ type: status[o].type, name: status[o].content }], status: "online" });
        }, 20000);
        function scheduleResetQuests() {
            const now = new Date();
            const nextTargetTime = new Date();
            if (now.getHours() > 24 || (now.getHours() === 24 && now.getMinutes() >= 0)) { nextTargetTime.setDate(nextTargetTime.getDate() + 1) };
            nextTargetTime.setHours(24, 0, 0, 0);
            const timeUntilTarget = nextTargetTime - now;
            setTimeout(() => { resetQuests(); scheduleResetQuests() }, timeUntilTarget);
        }
        function resetQuests() {
            console.log('Reset des quêtes :');
            db.query(`SELECT * FROM all_quests`, (err, all_quests_results) => {
                if (err) { console.error('Erreur lors de la récupération de all_quests :', err); return }
                db.query(`SELECT * FROM daily_quests`, (err, daily_quests_results) => {
                    if (err) { console.error('Erreur lors de la récupération de daily_quests :', err); return }
                    let questIds = daily_quests_results.map(result => parseInt(result.quest_id));
                    const filteredArray = all_quests_results.filter(quest => !questIds.includes(parseInt(quest.id)));
                    function shuffle(array) {
                        for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]] };
                        return array;
                    }
                    const shuffledArray = shuffle([...filteredArray]);
                    const randomThreeObjects = shuffledArray.slice(0, 3);
                    console.log(randomThreeObjects);
                    if (randomThreeObjects.length < 3) { console.error('Moins de 3 quêtes disponibles pour la réinitialisation'); return }
                    db.query(`UPDATE daily_quests SET quest_id = ${randomThreeObjects[0].id} WHERE id = '1'`, (err) => {
                        if (err) { console.log(err) };
                        db.query(`UPDATE daily_quests SET quest_id = ${randomThreeObjects[1].id} WHERE id = '2'`, (err) => {
                            if (err) { console.log(err) };
                            db.query(`UPDATE daily_quests SET quest_id = ${randomThreeObjects[2].id} WHERE id = '3'`, (err) => {
                                if (err) { console.log(err) };
                                console.log('Les quêtes ont été réinitialisées !');
                            });
                        });
                    });
                });
            });
        };
        scheduleResetQuests();
        setInterval(() => { db.query('SELECT 1', (err) => { if (err) { console.error('Erreur lors de la requête KEEP ALIVE :', err) } }) }, 20000);
        console.log(`Ready! Logged in as ${client.user.username}`);
    },
};
