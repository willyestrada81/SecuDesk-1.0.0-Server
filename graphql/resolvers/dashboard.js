const moment = require('moment')
const checkAuth = require('../../util/check-auth')
const IncidentLogs = require('../../models/IncidentLogs')

const getPercentage = (newNum, originalNum) => {
  if (originalNum === 0) {
    return null
  } else {
    const increase = newNum - originalNum
    return ((increase / originalNum) * 100).toFixed(2)
  }
}

module.exports = {
  Query: {
    async getDashboard (_, {}, context) { // eslint-disable-line
      checkAuth(context)
      try {
        const logs = await IncidentLogs.find()

        const incidentsLastHour = logs.filter(log => {
          return moment(log.createdAt).isBetween(
            moment().subtract(1, 'hour'),
            moment()
          )
        })
        const lastHour = moment().subtract(1, 'hour')

        const incidentsBeforeLastHour = logs.filter(log => {
          return moment(log.createdAt).isBetween(
            moment(lastHour).subtract(1, 'hour'),
            lastHour
          )
        })

        const percentageOfIncreaseByHour = getPercentage(
          incidentsLastHour.length,
          incidentsBeforeLastHour.length
        )

        const incidentsLast24Hours = logs.filter(log => {
          return moment(log.createdAt).isBetween(
            moment().startOf('day'),
            moment()
          )
        })

        const incidentsBeforeLast24Hours = logs.filter(log => {
          return moment(log.createdAt).isBetween(
            moment()
              .startOf('day')
              .subtract(24, 'hours'),
            moment().startOf('day')
          )
        })

        const percentageOfIncreaseBy24Hours = getPercentage(
          incidentsLast24Hours.length,
          incidentsBeforeLast24Hours.length
        )

        return {
          incidentsLastHour,
          incidentsBeforeLastHour,
          incidentsLast24Hours,
          incidentsBeforeLast24Hours,
          percentageOfIncreaseByHour,
          percentageOfIncreaseBy24Hours

        }
      } catch (err) {
        throw new Error(err)
      }
    }
  }
}
