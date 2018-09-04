const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const cheerio = require('cheerio')
const tableParser = require('cheerio-tableparser')
const textTable = require('text-table')
const ls = require('fast-levenshtein')

module.exports = class elise {
    static getHeroes(cb) {
        const $ = cheerio.load(this.get('https://feheroes.gamepedia.com/Hero_list'))
        tableParser($)

        const tableHeroes = $('table[style="text-align:center;width:100%"]').eq(0).parsetable(false, false, true)
        const tableHeroesNames = tableHeroes[1].slice(1)
        const tableHeroesTitles = tableHeroes[2].slice(1)

        this.heroes = []
        for (let i = 0; i < tableHeroesNames.length; i++) {
            this.heroes.push(`${tableHeroesNames[i]}: ${tableHeroesTitles[i]}`)
        }

        this.heroes.sort()
        console.log(`Database update: ${ new Date() }`)
        cb()
    }

    static get(url) {
        let xhr = new XMLHttpRequest()

        xhr.open('GET', url, false)

        xhr.send()

        return xhr.responseText
    }

    static heroVariations(hero) {
        let maxProbability = 0
        let selectedHero = ''
        let heroVariations = []

        this.heroes.forEach((heroName) => {
            let lsResult = ls.get(hero.toLowerCase(), heroName.toLowerCase().substring(0, heroName.indexOf(':')))
            let probability = Math.round((heroName.length - lsResult) * 100 / heroName.length)

            if (probability >= maxProbability) {
                maxProbability = probability
                selectedHero = heroName
            }
        })

        let selectedHeroName = selectedHero.substring(0, selectedHero.indexOf(':'))

        this.heroes.forEach((hero) => {
            let heroName = hero.substring(0, hero.indexOf(':'))
            if (heroName == selectedHeroName) {
                heroVariations.push(hero)
            }
        })

        this.currHero = 0
        return heroVariations
    }

    static heroesParse(heroVariations) {
        let heroes = []
        for (let i = 0; i < heroVariations.length; i++) {
            const hero = heroVariations[i]
            const $ = cheerio.load(this.get(`https://feheroes.gamepedia.com/${hero.replace(/\s/g, '_')}`))
            tableParser($)

            const min = $('table[style="text-align:center;width:500px"]').eq(0).parsetable(false, false, true)
            const max = $('table[style="text-align:center;width:500px"]').eq(1).parsetable(false, false, true)
            heroes.push(`${hero}\nMin:\n${textTable(min)}\n\nMax:\n${textTable(max)}`)
        }

        return heroes
    }
}
