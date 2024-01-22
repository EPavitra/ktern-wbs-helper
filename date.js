const moment = require("moment");

module.exports.setZeroHoursInDate = (date) => {
  // console.log(new Date(date));
  // console.log(moment(date).format("hh"));
  // console.log(moment(date).format("mm"));
  // console.log(moment(new Date(date)).set({ hour: 11 }).toDate());
  var formulatedDate = moment(new Date(date)).set({ hour: 11 }).toDate();
  // console.log(formulatedDate);
  // console.log(new Date(new Date("2023-11-05T18:30:00.000Z").setUTCHours(0, 0, 0, 0)));
  // return new Date(new Date(date).setUTCHours(0, 0, 0, 0));
  formulatedDate = moment(formulatedDate).format("YYYY-MM-DD");
  // console.log(formulatedDate);
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
