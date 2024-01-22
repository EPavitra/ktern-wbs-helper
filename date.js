const moment = require("moment");

module.exports.setZeroHoursInDate = (date) => {
  var formulatedDate = moment(new Date(date)).set({ hour: 11 }).toDate();
  formulatedDate = moment(formulatedDate).format("YYYY-MM-DD");
  return new Date(new Date(formulatedDate).setUTCHours(0, 0, 0, 0));
};

module.exports.parseDateStr = (date) => {
  const dateFormat = "DD/MM/YYYY";
  if (moment(date, dateFormat).format(dateFormat) === date) {
    return moment(date, dateFormat);
  } else {
    return moment(date);
  }
};
