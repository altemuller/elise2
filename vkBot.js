const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const latestApiVersion = '5.84'

module.exports = class vkBot {
    constructor({ groupId, accessToken, apiVersion, log }) {
        this.groupId = groupId // required
        this.accessToken = accessToken // required
        this.apiVersion = apiVersion ? apiVersion : latestApiVersion
        this.log = log ? log : false

        this.events = []
        this.rawUrl = 'https://api.vk.com/method'
    }

    hear(regexp, cb) {
        this.events.push({ regexp: regexp, cb: cb })
    }

    run() {
        const response = this.call('groups.getLongPollServer', {
            access_token: this.accessToken,
            group_id: this.groupId
        })

        this.server = response.server
        this.key = response.key
        this.ts = response.ts

        this.longPoll()
    }

    longPoll() {
        const response = this.get(`${this.server}?act=a_check&key=${this.key}&ts=${this.ts}&wait=25`)

        this.ts = response.ts

        if (response.updates[0]) {
            this.scan(response.updates[0].object)
        } else {
            this.longPoll()
        }
    }

    scan(update) {
        for (let i = 0; i < this.events.length; i++) {
            let event = this.events[i]
            let result = update.text.match(event.regexp)
            if (result) {
                let self = this
                let res = {
                    body: update,
                    $match: result,
                    user: {
                        user_id: update.from_id,
                        isMember: function() {
                            return self.call('groups.isMember', {
                                access_token: self.accessToken,
                                user_id: update.from_id,
                                group_id: self.groupId
                            })
                        }
                    },
                    send: function(message) {
                        self.call('messages.send', {
                            access_token: self.accessToken,
                            peer_id: update.peer_id,
                            message: message
                        })
                    }
                }
                event.cb(res)
            }
        }
        this.longPoll()
    }

    call(method, params) {
        return this.get(`${this.rawUrl}/${method}?${uri(params)}&v=${this.apiVersion}`).response
    }

    get(url) {
        let xhr = new XMLHttpRequest()

        xhr.open('GET', url, false)

        xhr.send()

        if (this.log) {
            console.log(`Status: ${xhr.status}`)
            console.log(`Response: ${xhr.responseText}\n`)
        }

        return JSON.parse(xhr.responseText)
    }
}

function uri(obj) {
    let str = ''
    for (var key in obj) {
        if (str != '') {
            str += '&'
        }
        str += key + '=' + encodeURIComponent(obj[key])
    }

    return str
}