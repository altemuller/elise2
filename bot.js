const vkBot = require('./vkBot')
const elise = require('./elise')

const bot = new vkBot({
    groupId: 159219251,
    accessToken: process.env.TOKEN
})

bot.hear(/^(bot|elise)\s(\w+)/i, (ctx) => {
    if (ctx.user.isMember()) {
        const heroes = elise.heroesParse(elise.heroVariations(ctx.$match[2]))
        heroes.forEach(hero => {
            ctx.send(hero)
        })
    } else {
        ctx.send('Подпишись на меня и я смогу показывать тебе IV героев :)')
    }
})

elise.getHeroes(() => {
    bot.run()
})