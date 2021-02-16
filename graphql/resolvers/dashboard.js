const moment = require("moment");
const checkAuth = require("../../util/check-auth");
const IncidentLogs = require("../../models/Incident_logs");

const getPercentage = (newNum, originalNum) => {
  if (originalNum === 0) {
    return null;
  } else {
    const increase = newNum - originalNum;
    return ((increase / originalNum) * 100).toFixed(2);
  }
};

module.exports = {
  Query: {
    async getDashboard(_, {}, context) {
      checkAuth(context);
      try {
        const logs = await IncidentLogs.find();

        const incidentsLastHour = logs.filter(log => {
          return moment(log.createdAt).isBetween(
            moment().subtract(1, "hour"),
            moment()
          );
        });
        const lastHour = moment().subtract(1, "hour");

        const incidentsBeforeLastHour = logs.filter(log => {
          return moment(log.createdAt).isBetween(
            moment(lastHour).subtract(1, "hour"),
            lastHour
          );
        });

        const percentageOfIncreaseByHour = getPercentage(
          incidentsLastHour.length,
          incidentsBeforeLastHour.length
        );

        const incidentsLast24Hours = logs.filter(log => {
          return moment(log.createdAt).isBetween(
            moment().startOf("day"),
            moment()
          );
        });

        const incidentsBeforeLast24Hours = logs.filter(log => {
          return moment(log.createdAt).isBetween(
            moment()
              .startOf("day")
              .subtract(24, "hours"),
            moment().startOf("day")
          );
        });

        const percentageOfIncreaseBy24Hours = getPercentage(
          incidentsLast24Hours.length,
          incidentsBeforeLast24Hours.length
        );

        const delivery = logs.filter(d => d.incidentType === "Delivery" && moment(d.createdAt).isAfter(moment().startOf('day')));
        const visitor = logs.filter(d => d.incidentType === "Visitor" && moment(d.createdAt).isAfter(moment().startOf('day')));
        const repairs = logs.filter(d => d.incidentType === "Repairs" && moment(d.createdAt).isAfter(moment().startOf('day')));

        const total = visitor.length + delivery.length + repairs.length;

        const percentageDelivery = total === 0 ? 0 : ((delivery.length / total) * 100).toFixed(2);
        const percentageVisitor = total === 0 ? 0 : ((visitor.length / total) * 100).toFixed(2);
        const percentageRepairs = total === 0 ? 0 : ((repairs.length / total) * 100).toFixed(2);

        return {
          incidentsLastHour,
          incidentsBeforeLastHour,
          incidentsLast24Hours,
          incidentsBeforeLast24Hours,
          percentageOfIncreaseByHour,
          percentageOfIncreaseBy24Hours,
          delivery,
          visitor,
          repairs,
          percentageDelivery,
          percentageVisitor,
          percentageRepairs
        };
      } catch (err) {
        throw new Error(err);
      }
    }
  }
};
