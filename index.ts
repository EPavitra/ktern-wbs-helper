import moment from "moment";
import * as _ from "underscore";
import * as dateHelper from "./date";

/**
 * Function to return IDs of different status
 * @param {any} dbStatus current status entries from DB
 * @returns {any} IDs of different status
 */
const formulateStatus = (dbStatus: any[]) => {
  //STATUS FORMULATION INITIAL SETUP
  let matchedNewStatus = _.filter(dbStatus, (dt) => {
    return dt.workItem === "Task" && dt.category === "New";
  });
  let matchedNewStatusIDs = _.map(matchedNewStatus, (dt) => {
    return dt._id.toString();
  });
  let matchedActiveStatus = _.filter(dbStatus, (dt) => {
    return dt.workItem === "Task" && dt.category === "Active";
  });
  let matchedActiveStatusIDs = _.map(matchedActiveStatus, (dt) => {
    return dt._id.toString();
  });
  let matchedCompletedStatus = _.filter(dbStatus, (dt) => {
    return dt.workItem === "Task" && dt.category === "Completed";
  });
  let matchedCompletedStatusIDs = _.map(matchedCompletedStatus, (dt) => {
    return dt._id.toString();
  });
  let matchedApprovedStatus = _.filter(dbStatus, (dt) => {
    return dt.workItem === "Task" && dt.category === "Approved";
  });
  let matchedApprovedStatusIDs = _.map(matchedApprovedStatus, (dt) => {
    return dt._id.toString();
  });
  return {
    matchedNewStatusIDs,
    matchedActiveStatusIDs,
    matchedApprovedStatusIDs,
    matchedCompletedStatusIDs,
  };
};

/**
 * Function to return input data which includes level in it
 * @param {any} data input data against which levels has to be updated
 * @returns {any} updated input data
 */
const formulateData = (data: any[], type: string) => {
  let idField = "$wbs";
  if (type === "workbook") {
    idField = "orderID";
  }
  data = data.map((dt) => {
    dt.level = dt[idField].split(".").length;
    return dt;
  });
  return data;
};

/**
 * Function to calculate durations of the task
 * @param {any} task a task in which durations has to be set
 * @param {any} projectSettings an array containing project settings
 * @param {any} eventDays an array which has start dates of the holiday events
 * @param {any} weekOffs an array which has weekoff details
 */
const formulateDurations = (
  task: any,
  projectSettings: any[],
  eventDays: any[],
  weekOffs: any[]
) => {
  if (task["plannedFrom"] && task["plannedTo"]) {
    const plannedFrom = dateHelper.parseDateStr(task["plannedFrom"]);
    const plannedTo = dateHelper.parseDateStr(task["plannedTo"]);
    let duration = plannedTo.diff(plannedFrom, "days");
    let finalDuration = plannedTo.diff(plannedFrom, "days");
    let nextDate = task["plannedFrom"];
    for (let i = 0; i < duration; i++) {
      nextDate = moment(
        new Date(new Date(nextDate).getTime() + 24 * 60 * 60 * 1000)
      ).format("YYYY-MM-DD");
      if (eventDays.includes(nextDate)) finalDuration--;
      else if (weekOffs.includes(new Date(nextDate).getDay())) finalDuration--;
    }

    if (duration >= 0) {
      finalDuration++;
      if (projectSettings[0]["duration"] == "hours")
        task.plannedDuration = finalDuration * 8;
      else if (projectSettings[0]["duration"] == "days")
        task.plannedDuration = finalDuration;
      else if (projectSettings[0]["duration"] == "months")
        task.plannedDuration = Math.round((finalDuration / 30) * 100) / 100;
    } else task.plannedDuration = "";
  } else task.plannedDuration = "";
  if (task["startedOn"] && task["completedOn"]) {
    const startedOn = dateHelper.parseDateStr(task["startedOn"]);
    const completedOn = dateHelper.parseDateStr(task["completedOn"]);
    var duration = completedOn.diff(startedOn, "days");
    var finalDuration = completedOn.diff(startedOn, "days");
    var nextDate = task["startedOn"];
    if (nextDate) {
      for (let i = 0; i < duration; i++) {
        nextDate = moment(
          new Date(new Date(nextDate).getTime() + 24 * 60 * 60 * 1000)
        ).format("YYYY-MM-DD");
        if (eventDays.includes(nextDate)) finalDuration--;
        else if (weekOffs.includes(new Date(nextDate).getDay()))
          finalDuration--;
      }
    }
    if (duration >= 0) {
      finalDuration++;
      if (projectSettings[0]["duration"] == "hours")
        task.actualDuration = finalDuration * 8;
      else if (projectSettings[0]["duration"] == "days")
        task.actualDuration = finalDuration;
      if (projectSettings[0]["duration"] == "months")
        task.actualDuration = Math.round((finalDuration / 30) * 100) / 100;
    } else task.actualDuration = "";
  } else task.actualDuration = "";
};

/**
 * Function to calculate status roll up for the tasks
 * @param {any} status a list of status
 * @param {any} statusObject object which contains IDs of different status
 * @returns {string} final status value
 */
const formulateStatusRollUp = (status: any[], statusObject: any) => {
  //STATUS ROLLUP
  let statusid = "";
  const uniqueStatus = [...new Set(status)];
  if (uniqueStatus.length > 1) {
    if (
      uniqueStatus.length === 2 &&
      uniqueStatus.includes(statusObject.matchedCompletedStatusIDs[0]) &&
      uniqueStatus.includes(statusObject.matchedApprovedStatusIDs[0])
    )
      statusid = statusObject.matchedCompletedStatusIDs[0].toString();
    else statusid = statusObject.matchedActiveStatusIDs[0].toString();
  } else if (uniqueStatus.length == 1) statusid = uniqueStatus[0];
  else statusid = statusObject.matchedNewStatusIDs[0].toString();
  return statusid;
};

/**
 * Function to calculate status, dates and weightage for analytics
 * @param {any} data input data against which calculations has to be made
 * @param {any} dbStatus current status entries from DB
 * @param {number} maxLevel maximum nested level at which calculation has to be done
 * @returns {any} data with status, date and weightage included
 */
export const formulateStatusDatesWeightageForAnalytics = (
  data: any[],
  dbStatus: any[],
  maxLevel: number
) => {
  console.time("formulate-status-dates-weightage");
  data = formulateData(data, "analytics");

  //STATUS FORMULATION INITIAL SETUP
  let statusObject = formulateStatus(dbStatus);

  //LOOP STARTS
  for (let i = maxLevel - 1; i >= 1; i--) {
    let matchedTasks = _.filter(data, (dt) => {
      return dt.level == i;
    });
    for (let j = 0; j < matchedTasks.length; j++) {
      var matchedChildTasks = _.filter(data, function (dt) {
        return matchedTasks[j].id.toString() === dt.parent.toString();
      });
      let status = [];
      var plannedWeightage = 0;
      var actualWeightage = 0;
      for (var k = 0; k < matchedChildTasks.length; k++) {
        if (matchedChildTasks[k]["status"].length > 0)
          status.push(matchedChildTasks[k]["status"][0]["_id"].toString());
        else status.push(statusObject.matchedNewStatusIDs[0].toString());
        plannedWeightage =
          plannedWeightage + matchedChildTasks[k]["plannedWeightage"];
        actualWeightage =
          actualWeightage + matchedChildTasks[k]["actualWeightage"];
      }

      if (matchedChildTasks.length === 0) {
        if (matchedTasks[j].status.length > 0) {
          status.push(matchedTasks[j].status[0]["_id"].toString());
        }
      }

      var statusid = formulateStatusRollUp(status, statusObject);
      matchedTasks[j]["status"] = _.filter(dbStatus, function (dt) {
        return dt._id.toString() === statusid;
      });
      matchedTasks[j]["plannedWeightage"] = plannedWeightage;
      matchedTasks[j]["actualWeightage"] = actualWeightage;
      matchedTasks[j]["progress"] =
        Math.round((actualWeightage / plannedWeightage) * 100) || 0;
    }
  }
  console.timeEnd("formulate-status-dates-weightage");
  return data;
};

/**
 * Function to calculate status, dates and weightage for workbook
 * @param {any} data data input data against which calculations has to be made
 * @param {any} dbStatus dbStatus current status entries from DB
 * @param {any} projectInfo information about the particular project
 * @param {any} maxLevel maximum nested level at which calculation has to be done
 * @returns {any} data with status, date and weightage included
 */

//FORMULATE STATUS, DATE AND WEIGHTAGE FOR GIVEN DATA
export const formulateStatusDatesWeightageForWorkbook = (
  data: any[],
  dbStatus: any[],
  projectInfo: any,
  maxLevel: number
) => {
  console.time("formulate-status-dates-weightage");
  console.log("---------------------------------------------------");
  maxLevel = maxLevel + 2; //CONSIDERING PHASE AND SUBPHASE THEREFORE +2
  data = formulateData(data, "workbook");
  //PROJECT INFO FORMULATION INITIAL SETUP
  let eventDays = [];
  let weekOffs = [];
  let projectCalendar = _.filter(projectInfo, function (dt) {
    if (dt) return dt.title === "Project Calendar";
  });
  let projectSettings = _.filter(projectInfo, function (dt) {
    if (dt) return dt.title === "Project Settings";
  });
  if (projectCalendar.length > 0) {
    for (var i = 0; i < projectCalendar[0].holidayEvents.length; i++) {
      if (projectCalendar[0].holidayEvents[i].startDate)
        eventDays.push(
          moment(
            new Date(projectCalendar[0].holidayEvents[i].startDate)
          ).format("YYYY-MM-DD")
        );
    }

    for (var i = 0; i < projectCalendar[0].weekends.length; i++) {
      if (projectCalendar[0].weekends[i] == "Sunday") weekOffs.push(0);
      if (projectCalendar[0].weekends[i] == "Monday") weekOffs.push(1);
      if (projectCalendar[0].weekends[i] == "Tuesday") weekOffs.push(2);
      if (projectCalendar[0].weekends[i] == "Wednesday") weekOffs.push(3);
      if (projectCalendar[0].weekends[i] == "Thursday") weekOffs.push(4);
      if (projectCalendar[0].weekends[i] == "Friday") weekOffs.push(5);
      if (projectCalendar[0].weekends[i] == "Saturday") weekOffs.push(6);
    }
  }
  //STATUS FORMULATION INITIAL SETUP
  let statusObject = formulateStatus(dbStatus);

  //ACTUAL PROJECT METRIC CALCULATION DEPENDENCIES
  let activepercentage = 0;
  if (projectSettings.length > 0) {
    if (projectSettings[0].activepercentage) {
      activepercentage = projectSettings[0].activepercentage;
    }
  }
  //LOOP STARTS
  let wbsObjects: any = {};
  for (let i = maxLevel; i >= 3; i--) {
    let matchedTasks = _.filter(data, (dt) => {
      return dt.level == i;
    });
    for (let j = 0; j < matchedTasks.length; j++) {
      let matchedOrderID;
      matchedOrderID = matchedTasks[j]["orderID"]
        .split(".")
        .slice(0, -1)
        .join(".");
      if (matchedTasks[j].orderID in wbsObjects) {
        const matchedWbsObject = wbsObjects[matchedTasks[j].orderID];
        if (!(matchedOrderID in wbsObjects))
          wbsObjects[matchedOrderID] = {
            status: [],
            plannedFrom: [],
            plannedTo: [],
            startedOn: [],
            completedOn: [],
            plannedEffort: 0,
            actualEffort: 0,
            plannedWeightage: 0,
            actualWeightage: 0,
            plannedStorypoint: 0,
            actualStorypoint: 0,
          };

        matchedTasks[j].status = formulateStatusRollUp(
          matchedWbsObject.status,
          statusObject
        );
        wbsObjects[matchedOrderID]["status"].push(matchedTasks[j].status);
        const uniqueStatus = [...new Set(matchedWbsObject.status)];
        //ACTUAL DATES ROLLUP
        if (matchedWbsObject.startedOn.length > 0)
          matchedTasks[j]["startedOn"] = new Date(
            Math.min.apply(null, matchedWbsObject.startedOn)
          );
        else matchedTasks[j]["startedOn"] = "";
        if (
          matchedWbsObject.completedOn.length > 0 &&
          !uniqueStatus.includes(statusObject.matchedActiveStatusIDs[0]) &&
          !uniqueStatus.includes(statusObject.matchedNewStatusIDs[0])
        )
          matchedTasks[j]["completedOn"] = new Date(
            Math.max.apply(null, matchedWbsObject.completedOn)
          );
        else matchedTasks[j]["completedOn"] = "";
        if (matchedTasks[j]["startedOn"])
          wbsObjects[matchedOrderID]["startedOn"].push(
            matchedTasks[j]["startedOn"]
          );
        if (matchedTasks[j]["completedOn"])
          wbsObjects[matchedOrderID]["completedOn"].push(
            matchedTasks[j]["completedOn"]
          );

        //PLANNED DATES ROLLUP
        if (matchedWbsObject.plannedFrom.length > 0)
          matchedTasks[j]["plannedFrom"] = new Date(
            Math.min.apply(null, matchedWbsObject.plannedFrom)
          );
        else matchedTasks[j]["plannedFrom"] = "";
        if (matchedWbsObject.plannedTo.length > 0)
          matchedTasks[j]["plannedTo"] = new Date(
            Math.max.apply(null, matchedWbsObject.plannedTo)
          );
        else matchedTasks[j]["plannedTo"] = "";
        if (matchedTasks[j]["plannedFrom"])
          wbsObjects[matchedOrderID]["plannedFrom"].push(
            matchedTasks[j]["plannedFrom"]
          );
        if (matchedTasks[j]["plannedTo"])
          wbsObjects[matchedOrderID]["plannedTo"].push(
            matchedTasks[j]["plannedTo"]
          );

        //PROGRESS METRIC ROLLUP
        matchedTasks[j]["plannedEffort"] = matchedWbsObject.plannedEffort;
        matchedTasks[j]["plannedWeightage"] = matchedWbsObject.plannedWeightage;
        matchedTasks[j]["plannedStorypoint"] =
          matchedWbsObject.plannedStorypoint;
        matchedTasks[j]["actualEffort"] = matchedWbsObject.actualEffort;
        matchedTasks[j]["actualWeightage"] = matchedWbsObject.actualWeightage;
        matchedTasks[j]["actualStorypoint"] = matchedWbsObject.actualStorypoint;

        wbsObjects[matchedOrderID]["plannedEffort"] +=
          matchedTasks[j]["plannedEffort"];
        wbsObjects[matchedOrderID]["plannedWeightage"] +=
          matchedTasks[j]["plannedWeightage"];
        wbsObjects[matchedOrderID]["plannedStorypoint"] +=
          matchedTasks[j]["plannedStorypoint"];
        wbsObjects[matchedOrderID]["actualEffort"] +=
          matchedTasks[j]["actualEffort"];
        wbsObjects[matchedOrderID]["actualWeightage"] +=
          matchedTasks[j]["actualWeightage"];
        wbsObjects[matchedOrderID]["actualStorypoint"] +=
          matchedTasks[j]["actualStorypoint"];

        //ACTUAL DURATIONS
        formulateDurations(
          matchedTasks[j],
          projectSettings,
          eventDays,
          weekOffs
        );
      } else {
        let statusObj;
        if (matchedTasks[j].status) {
          statusObj = matchedTasks[j].status.toString();
        } else {
          statusObj = statusObject.matchedNewStatusIDs[0].toString();
        }
        if (matchedTasks[j].plannedFrom)
          matchedTasks[j]["plannedFrom"] = dateHelper.setZeroHoursInDate(
            moment(matchedTasks[j]["plannedFrom"], "DD/MM/YYYY")
          );
        else matchedTasks[j]["plannedFrom"] = "";

        if (matchedTasks[j].plannedTo)
          matchedTasks[j]["plannedTo"] = dateHelper.setZeroHoursInDate(
            moment(matchedTasks[j]["plannedTo"], "DD/MM/YYYY")
          );
        else matchedTasks[j]["plannedTo"] = "";

        if (!(matchedOrderID in wbsObjects)) {
          wbsObjects[matchedOrderID] = {
            status: [],
            plannedFrom: [],
            plannedTo: [],
            startedOn: [],
            completedOn: [],
            plannedEffort: 0,
            actualEffort: 0,
            plannedWeightage: 0,
            actualWeightage: 0,
            plannedStorypoint: 0,
            actualStorypoint: 0,
          };
        }
        //STATUS FORMULATION
        matchedTasks[j].status = statusObj;
        wbsObjects[matchedOrderID]["status"].push(statusObj);

        //ACTUAL DATES CALCULATION AND PROGRESS METRIC
        if (
          statusObject.matchedNewStatusIDs.includes(statusObj) ||
          statusObj == ""
        ) {
          matchedTasks[j].startedOn = "";
          matchedTasks[j].completedOn = "";
          matchedTasks[j].actualWeightage = 0;
          matchedTasks[j].actualEffort = 0;
          matchedTasks[j].actualStorypoint = 0;
        } else if (statusObject.matchedActiveStatusIDs.includes(statusObj)) {
          matchedTasks[j].completedOn = "";
          if (matchedTasks[j].startedOn)
            matchedTasks[j].startedOn = dateHelper.setZeroHoursInDate(
              moment(matchedTasks[j].startedOn, "DD/MM/YYYY")
            );
          else
            matchedTasks[j].startedOn = dateHelper.setZeroHoursInDate(
              new Date()
            );
          matchedTasks[j].actualEffort =
            (matchedTasks[j]["plannedEffort"] * activepercentage) / 100 || 0;
          matchedTasks[j].actualWeightage =
            (matchedTasks[j]["plannedWeightage"] * activepercentage) / 100 || 0;
          matchedTasks[j].actualStorypoint =
            (matchedTasks[j]["plannedStorypoint"] * activepercentage) / 100 ||
            0;
        } else if (
          statusObject.matchedCompletedStatusIDs.includes(statusObj) ||
          statusObject.matchedApprovedStatusIDs.includes(statusObj)
        ) {
          if (matchedTasks[j].startedOn)
            matchedTasks[j].startedOn = dateHelper.setZeroHoursInDate(
              moment(matchedTasks[j].startedOn, "DD/MM/YYYY")
            );
          else
            matchedTasks[j].startedOn = dateHelper.setZeroHoursInDate(
              new Date()
            );
          if (matchedTasks[j].completedOn)
            matchedTasks[j].completedOn = dateHelper.setZeroHoursInDate(
              moment(matchedTasks[j].completedOn, "DD/MM/YYYY")
            );
          else
            matchedTasks[j].completedOn = dateHelper.setZeroHoursInDate(
              new Date()
            );
          matchedTasks[j].actualEffort = matchedTasks[j]["plannedEffort"] || 0;
          matchedTasks[j].actualWeightage =
            matchedTasks[j]["plannedWeightage"] || 0;
          matchedTasks[j].actualStorypoint =
            matchedTasks[j]["plannedStorypoint"] || 0;
        } else if (
          (matchedTasks[j]["startedOn"] &&
            matchedTasks[j]["startedOn"] !== "") ||
          (matchedTasks[j]["completedOn"] &&
            matchedTasks[j]["completedOn"] !== "")
        ) {
          if (
            matchedTasks[j]["startedOn"] &&
            matchedTasks[j]["startedOn"] !== ""
          ) {
            matchedTasks[j]["startedOn"] = dateHelper.setZeroHoursInDate(
              moment(matchedTasks[j].startedOn, "DD/MM/YYYY")
            );
          }
          if (
            matchedTasks[j]["completedOn"] &&
            matchedTasks[j]["completedOn"] !== ""
          ) {
            matchedTasks[j]["completedOn"] = dateHelper.setZeroHoursInDate(
              moment(matchedTasks[j].completedOn, "DD/MM/YYYY")
            );
          }
        }
        if (matchedTasks[j]["startedOn"])
          wbsObjects[matchedOrderID]["startedOn"].push(
            matchedTasks[j]["startedOn"]
          );
        if (matchedTasks[j]["completedOn"])
          wbsObjects[matchedOrderID]["completedOn"].push(
            matchedTasks[j]["completedOn"]
          );
        if (matchedTasks[j]["plannedFrom"])
          wbsObjects[matchedOrderID]["plannedFrom"].push(
            matchedTasks[j]["plannedFrom"]
          );
        if (matchedTasks[j]["plannedTo"])
          wbsObjects[matchedOrderID]["plannedTo"].push(
            matchedTasks[j]["plannedTo"]
          );
        wbsObjects[matchedOrderID]["plannedEffort"] +=
          matchedTasks[j]["plannedEffort"] || 0;
        wbsObjects[matchedOrderID]["plannedWeightage"] +=
          matchedTasks[j]["plannedWeightage"] || 0;
        wbsObjects[matchedOrderID]["plannedStorypoint"] +=
          matchedTasks[j]["plannedStorypoint"] || 0;
        wbsObjects[matchedOrderID]["actualEffort"] +=
          matchedTasks[j]["actualEffort"] || 0;
        wbsObjects[matchedOrderID]["actualWeightage"] +=
          matchedTasks[j]["actualWeightage"] || 0;
        wbsObjects[matchedOrderID]["actualStorypoint"] +=
          matchedTasks[j]["actualStorypoint"] || 0;

        //ACTUAL DURATIONS
        formulateDurations(
          matchedTasks[j],
          projectSettings,
          eventDays,
          weekOffs
        );
      }
    }
  }
  console.timeEnd("formulate-status-dates-weightage");
  return data;
};
