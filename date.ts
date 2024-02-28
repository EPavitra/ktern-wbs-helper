import moment, { Moment } from "moment";

export const setZeroHoursInDate = (date: string | number | Date | Moment) => {
  const formulatedDate = moment(date).set({ hour: 11 }).toDate();
  const formulatedDateStr = moment(formulatedDate).format("YYYY-MM-DD");
  return new Date(new Date(formulatedDateStr).setUTCHours(0, 0, 0, 0));
};

export const parseDateStr = (date: string | Date) => {
  const dateFormat = "DD/MM/YYYY";
  if (moment(date, dateFormat).format(dateFormat) === date) {
    return moment(date, dateFormat);
  } else {
    return moment(date);
  }
};
