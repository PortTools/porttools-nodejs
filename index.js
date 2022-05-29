const axios = require('axios').default;
const moment = require('moment');

const URL_ENDPOINT = 'https://port.tools/api/remote'

const dateTimeFormat = "YYYY-MM-DD HH:mm:ss Z"

class PortTools {
    constructor(id, key = null, cacheTime = null, retry = 0, useLastIfError = true) {
        this.id = id;
        this.key = key;
        this.cacheTime = cacheTime;
        this.retry = retry;
        this.useLastIfError = useLastIfError;
        this.ipv4 = null;
        this.ipv6 = null;
        this.lastRequest = null;
        this.lastUpdate = null;
    }

    getDataFromCache(cacheTime) {
        if (!cacheTime || !this.lastUpdate) {
            return null
        }
        const expirationTime = moment(this.lastUpdate, dateTimeFormat).add(cacheTime, "minutes").utc();
        console.log("expirationTime", expirationTime);
        if (moment().utc().isAfter(expirationTime)) {
            return null;
        }

        return this
    }

    async request() {
        const dataFromCache = this.getDataFromCache(this.cacheTime);
        if (dataFromCache) {
            console.log('Got data from cache');
            return dataFromCache;
        }

        let count = 1;
        const maxRetry = this.retry > 0 ? parseInt(this.retry) : 1;
        while (count <= maxRetry) {
            var body = { 'id': this.id, 'key': this.key }
            try {
                console.log('Rety', count);
                const response = await axios.post(URL_ENDPOINT, body);
                if (response?.status === 200) {
                    const data = response.data;
                    if (data && data.ok) {
                        this.ipv4 = data.ipv4
                        this.ipv6 = data.ipv6
                        if (data.last_update) {
                            this.lastUpdate = moment(data.last_update, dateTimeFormat).format(dateTimeFormat)
                        }
                        if (data.request_time) {
                            this.lastRequest = moment(data.request_time, dateTimeFormat).format(dateTimeFormat)
                        }
                        console.log('this', this)
                        return;
                    }
                    else {
                        console.log('Error when getting data', data);
                    }
                } else {
                    console.log('Error with resonse code', response?.status);
                }

            } catch (error) {
                console.log('Error when getting response', error);
            } finally {
                count += 1;
                if (count > maxRetry && !this.ipv4) {
                    return this.useLastIfError ? this : null
                }
            }
        }
    }

    async getInfor() {
        await this.request();
        const infor = {
            "ipv4": this.ipv4,
            "ipv6": this.ipv4,
            "lastRequest": this.lastRequest,
            "lastUpdate": this.lastUpdate,
        }

        return infor
    }
}
// (async () => {
//     const port = new PortTools('716107D963', null, -10, 3);
//     var infor = await port.getInfor();
//     console.log('infor', infor);
// })();
