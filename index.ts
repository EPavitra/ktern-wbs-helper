import moment from "moment";
import * as _ from "underscore";
import * as dateHelper from "./date";
import { z } from "zod";

const objectId = z.union([z.string(), z.object({})]);

const DBStatusSchema = z.object({
  _id: objectId,
  workItem: z.string(),
  status: z.string(),
  category: z.string().optional(),
  mailTrigger: z.boolean().optional(),
  color: z.string().optional(),
});

export type DBStatus = z.infer<typeof DBStatusSchema>;

const InputDataSchema = z.object({
  _id: objectId,
  inid: z.string().optional(),
  itemID: z.any().optional(),
  orderID: z.string(),
  itemLevel: z.number().optional(),
  title: z.string(),
  description: z.string().optional(),
  status: z.union([z.string(), z.array(z.string()), z.array(DBStatusSchema)]),
  phase: z.string().optional(),
  subPhaseID: z.string(),
  assignedTo: z.string(),
  createdBy: z.string().optional(),
  createdOn: z.string().optional(),
  refTaskID: z.string(),
  participants: z.array(z.any()).optional(),
  type: z.array(z.any()),
  plannedEnvironment: z.array(z.any()).optional(),
  actualEnvironment: z.array(z.any()).optional(),
  acceptanceCriteria: z.any().optional(),
  priority: z.string().optional(),
  tags: z.array(z.any()).optional(),
  plannedFrom: z.union([z.string(), z.date()]),
  plannedTo: z.union([z.string(), z.date()]),
  startedOn: z.union([z.string(), z.date()]),
  completedOn: z.union([z.string(), z.date()]),
  plannedDuration: z.union([z.string(), z.number()]).optional(),
  actualDuration: z.union([z.string(), z.number()]).optional(),
  plannedProgress: z.number().optional(),
  actualProgress: z.number().optional(),
  source: z.string().optional(),
  plannedLocation: z.string().optional(),
  actualLocation: z.string().optional(),
  plannedEffort: z.number(),
  actualEffort: z.number(),
  plannedWeightage: z.number(),
  actualWeightage: z.number(),
  plannedStorypoint: z.number(),
  actualStorypoint: z.number(),
  activePercentage: z.union([z.string(), z.number()]).optional(),
  skip: z.boolean().optional(),
  savedBy: z.string().optional(),
  savedOn: z.string().optional(),
  versionID: z.string().optional(),
  versionName: z.string().optional(),
  taskType: z.array(z.any()).optional(),
  level: z.number().optional(),
  $wbs: z.string().optional(),
  id: z.string().optional(),
  parent: z.string().optional(),
  parentID: z.string().optional(),
  progress: z.number().optional(),
});

export type InputData = z.infer<typeof InputDataSchema>;

const StatusObjectSchema = z.object({
  matchedNewStatusIDs: z.array(z.string()),
  matchedActiveStatusIDs: z.array(z.string()),
  matchedApprovedStatusIDs: z.array(z.string()),
  matchedCompletedStatusIDs: z.array(z.string()),
});

export type StatusObject = z.infer<typeof StatusObjectSchema>;

const MapspropertiesSchema = z.object({
  businessTransformation: z.boolean(),
  versionList: z.array(z.object({})),
});

const ProgressMetricSchema = z.object({
  effort: z.boolean(),
  storypoint: z.boolean(),
  weightage: z.boolean(),
});

const ProjectSettingsSchema = z.object({
  _id: objectId,
  title: z.literal("Project Settings"),
  activateMethodology: z.boolean(),
  approvals: z.boolean(),
  subscription: z.boolean(),
  disableActualDates: z.boolean(),
  fileManagement: z.string(),
  dateFormulation: z.boolean(),
  statusFormulation: z.boolean(),
  disabledDuration: z.boolean(),
  duration: z.string(),
  active: z.boolean(),
  milestonecalc: z.string(),
  mapsproperties: MapspropertiesSchema,
  customermilestonepercentage: z.boolean(),
  progressmetric: ProgressMetricSchema,
  activepercentage: z.number(),
  activeTaskProgressMetric: z.number().optional(),
});

export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;

export type Mapsproperties = z.infer<typeof MapspropertiesSchema>;

export type Progressmetric = z.infer<typeof ProgressMetricSchema>;

const HolidayEventSchema = z.object({
  startDate: z.string(),
});

const ProjectCalendarSchema = z.object({
  _id: objectId,
  version: z.number(),
  title: z.literal("Project Calendar"),
  refID: objectId,
  createdBy: objectId,
  createdOn: z.union([z.string(), z.date()]),
  projects: z.array(z.object({})),
  calendarName: z.string(),
  weekends: z.array(z.string()),
  holidayEvents: z.array(HolidayEventSchema),
  active: z.boolean(),
  lastEditedBy: objectId,
  lastEditedOn: z.union([z.string(), z.date()]),
});

export type ProjectCalendar = z.infer<typeof ProjectCalendarSchema>;

export type HolidayEvent = z.infer<typeof HolidayEventSchema>;

const ProjectInfoSchema = z.union([
  ProjectSettingsSchema,
  ProjectCalendarSchema,
]);

export type ProjectInfo = z.infer<typeof ProjectInfoSchema>;

/**
 * Function to return IDs of different status
 * @param {DBStatus} dbStatus current status entries from DB
 * @returns {StatusObject} IDs of different status
 */
const formulateStatus = (dbStatus: DBStatus[]) => {
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
  } as StatusObject;
};

/**
 * Function to return input data which includes level in it
 * @param {InputData[]} data input data against which levels has to be updated
 * @param {string} type defines the type of data
 * @returns {InputData[]} updated input data
 */
const formulateData = (data: InputData[], type: string) => {
  data = data.map((dt) => {
    if (type === "workbook") {
      dt.level = dt.orderID.split(".").length;
    } else if (dt.$wbs) {
      dt.level = dt.$wbs.split(".").length;
    }
    return dt;
  });
  return data;
};

/**
 * Function to calculate durations of the task
 * @param {InputData} task a task in which durations has to be set
 * @param {ProjectSettings[]} projectSettings an array containing project settings
 * @param {string[]} eventDays an array which has start dates of the holiday events
 * @param {number[]} weekOffs an array which has weekoff details
 */
const formulateDurations = (
  task: InputData,
  projectSettings: ProjectSettings[],
  eventDays: string[],
  weekOffs: number[]
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
 * @param {string[]} status a list of status
 * @param {StatusObject} statusObject object which contains IDs of different status
 * @returns {string} final status value
 */
const formulateStatusRollUp = (
  status: string[],
  statusObject: StatusObject
) => {
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
 * @param {InputData[]} data input data against which calculations has to be made
 * @param {DBStatus[]} dbStatus current status entries from DB
 * @param {number} maxLevel maximum nested level at which calculation has to be done
 * @returns {InputData[]} data with status, date and weightage included
 */
export const formulateStatusDatesWeightageForAnalytics = (
  data: InputData[],
  dbStatus: DBStatus[],
  maxLevel: number
) => {
  z.array(InputDataSchema).parse(data);
  z.array(DBStatusSchema).parse(dbStatus);
  z.number().parse(maxLevel);
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
        return matchedTasks[j].id?.toString() === dt.parent?.toString();
      });
      let status = [];
      var plannedWeightage = 0;
      var actualWeightage = 0;
      for (var k = 0; k < matchedChildTasks.length; k++) {
        if (matchedChildTasks[k]["status"].length > 0)
          status.push(
            (matchedChildTasks[k]["status"][0] as DBStatus)["_id"].toString()
          );
        else status.push(statusObject.matchedNewStatusIDs[0].toString());
        plannedWeightage =
          plannedWeightage + matchedChildTasks[k]["plannedWeightage"];
        actualWeightage =
          actualWeightage + matchedChildTasks[k]["actualWeightage"];
      }

      if (matchedChildTasks.length === 0) {
        if (matchedTasks[j].status.length > 0) {
          status.push(
            (matchedTasks[j].status[0] as DBStatus)["_id"].toString()
          );
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
 * @param {InputData[]} data data input data against which calculations has to be made
 * @param {DBStatus[]} dbStatus dbStatus current status entries from DB
 * @param {ProjectInfo[]} projectInfo information about the particular project
 * @param {number} maxLevel maximum nested level at which calculation has to be done
 * @returns {InputData[]} data with status, date and weightage included
 */

//FORMULATE STATUS, DATE AND WEIGHTAGE FOR GIVEN DATA
export const formulateStatusDatesWeightageForWorkbook = (
  data: InputData[],
  dbStatus: DBStatus[],
  projectInfo: ProjectInfo[],
  maxLevel: number
) => {
  z.array(InputDataSchema).parse(data);
  z.array(DBStatusSchema).parse(dbStatus);
  projectInfo.forEach((info) => {
    if (info.title === "Project Calendar") ProjectCalendarSchema.parse(info);
    else ProjectSettingsSchema.parse(info);
  });
  z.number().parse(maxLevel);
  console.time("formulate-status-dates-weightage");
  console.log("---------------------------------------------------");
  maxLevel = maxLevel + 2; //CONSIDERING PHASE AND SUBPHASE THEREFORE +2
  data = formulateData(data, "workbook");
  //PROJECT INFO FORMULATION INITIAL SETUP
  let eventDays = [];
  let weekOffs = [];
  let projectCalendar = _.filter(projectInfo, function (dt) {
    return dt?.title === "Project Calendar";
  }) as ProjectCalendar[];
  let projectSettings = _.filter(projectInfo, function (dt) {
    return dt?.title === "Project Settings";
  }) as ProjectSettings[];
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

      if (matchedTasks[j].refTaskID)
        matchedTasks[j].parentID = matchedTasks[j].refTaskID.toString();
      else matchedTasks[j].parentID = matchedTasks[j].subPhaseID.toString();

      const parentID = matchedTasks[j].parentID;
      if (parentID !== undefined) {
        if ((matchedTasks[j]._id as string) in wbsObjects) {
          const matchedWbsObject = wbsObjects[matchedTasks[j]._id as string];
          if (!(parentID in wbsObjects))
            wbsObjects[parentID] = {
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
              activePercentage: 0,
              childTasks: 1,
            };
          else {
            if (wbsObjects[parentID]["childTasks"]) {
              wbsObjects[parentID]["childTasks"] += 1;
            } else {
              wbsObjects[parentID]["childTasks"] = 1;
            }
          }

          matchedTasks[j].status = formulateStatusRollUp(
            matchedWbsObject.status,
            statusObject
          );
          wbsObjects[parentID]["status"].push(matchedTasks[j].status);

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
            wbsObjects[parentID]["startedOn"].push(
              matchedTasks[j]["startedOn"]
            );
          if (matchedTasks[j]["completedOn"])
            wbsObjects[parentID]["completedOn"].push(
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
            wbsObjects[parentID]["plannedFrom"].push(
              matchedTasks[j]["plannedFrom"]
            );
          if (matchedTasks[j]["plannedTo"])
            wbsObjects[parentID]["plannedTo"].push(
              matchedTasks[j]["plannedTo"]
            );

          //PROGRESS METRIC ROLLUP
          matchedTasks[j]["plannedEffort"] = matchedWbsObject.plannedEffort;
          matchedTasks[j]["plannedWeightage"] =
            matchedWbsObject.plannedWeightage;
          matchedTasks[j]["plannedStorypoint"] =
            matchedWbsObject.plannedStorypoint;
          matchedTasks[j]["actualEffort"] = matchedWbsObject.actualEffort;
          matchedTasks[j]["actualWeightage"] = matchedWbsObject.actualWeightage;
          matchedTasks[j]["actualStorypoint"] =
            matchedWbsObject.actualStorypoint;
          matchedTasks[j]["activePercentage"] = (
            matchedWbsObject.activePercentage / matchedWbsObject.childTasks
          ).toFixed(5);

          wbsObjects[parentID]["plannedEffort"] +=
            matchedTasks[j]["plannedEffort"];
          wbsObjects[parentID]["plannedWeightage"] +=
            matchedTasks[j]["plannedWeightage"];
          wbsObjects[parentID]["plannedStorypoint"] +=
            matchedTasks[j]["plannedStorypoint"];
          wbsObjects[parentID]["actualEffort"] +=
            matchedTasks[j]["actualEffort"];
          wbsObjects[parentID]["actualWeightage"] +=
            matchedTasks[j]["actualWeightage"];
          wbsObjects[parentID]["actualStorypoint"] +=
            matchedTasks[j]["actualStorypoint"];
          wbsObjects[parentID]["activePercentage"] += parseFloat(
            matchedTasks[j]["activePercentage"] as string
          );

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

          if (!(parentID in wbsObjects)) {
            wbsObjects[parentID] = {
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
              activePercentage: 0,
              childTasks: 0,
            };
          }
          //STATUS FORMULATION
          matchedTasks[j].status = statusObj;
          wbsObjects[parentID]["status"].push(statusObj);

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
            matchedTasks[j].activePercentage = 0;
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
              (matchedTasks[j]["plannedEffort"] *
                parseFloat(matchedTasks[j]["activePercentage"] as string)) /
                100 || 0;

            matchedTasks[j].actualWeightage = projectSettings[0]
              .activeTaskProgressMetric
              ? (matchedTasks[j]["plannedWeightage"] *
                  parseFloat(matchedTasks[j]["activePercentage"] as string)) /
                100
              : (matchedTasks[j]["plannedWeightage"] * activepercentage) /
                  100 || 0;

            matchedTasks[j].actualStorypoint = projectSettings[0]
              .activeTaskProgressMetric
              ? (matchedTasks[j]["plannedStorypoint"] *
                  parseFloat(matchedTasks[j]["activePercentage"] as string)) /
                100
              : (matchedTasks[j]["plannedStorypoint"] * activepercentage) /
                  100 || 0;
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
            matchedTasks[j].actualEffort =
              matchedTasks[j]["plannedEffort"] || 0;
            matchedTasks[j].actualWeightage =
              matchedTasks[j]["plannedWeightage"] || 0;
            matchedTasks[j].actualStorypoint =
              matchedTasks[j]["plannedStorypoint"] || 0;
            matchedTasks[j].activePercentage = 100;
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
            wbsObjects[parentID]["startedOn"].push(
              matchedTasks[j]["startedOn"]
            );
          if (matchedTasks[j]["completedOn"])
            wbsObjects[parentID]["completedOn"].push(
              matchedTasks[j]["completedOn"]
            );
          if (matchedTasks[j]["plannedFrom"])
            wbsObjects[parentID]["plannedFrom"].push(
              matchedTasks[j]["plannedFrom"]
            );
          if (matchedTasks[j]["plannedTo"])
            wbsObjects[parentID]["plannedTo"].push(
              matchedTasks[j]["plannedTo"]
            );
          wbsObjects[parentID]["plannedEffort"] +=
            matchedTasks[j]["plannedEffort"] || 0;
          wbsObjects[parentID]["plannedWeightage"] +=
            matchedTasks[j]["plannedWeightage"] || 0;
          wbsObjects[parentID]["plannedStorypoint"] +=
            matchedTasks[j]["plannedStorypoint"] || 0;
          wbsObjects[parentID]["actualEffort"] +=
            matchedTasks[j]["actualEffort"] || 0;
          wbsObjects[parentID]["actualWeightage"] +=
            matchedTasks[j]["actualWeightage"] || 0;
          wbsObjects[parentID]["actualStorypoint"] +=
            matchedTasks[j]["actualStorypoint"] || 0;
          wbsObjects[parentID]["childTasks"] += 1;

          if (matchedTasks[j].activePercentage)
            wbsObjects[parentID]["activePercentage"] += parseFloat(
              matchedTasks[j]["activePercentage"] as string
            );

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
  }
  console.timeEnd("formulate-status-dates-weightage");
  return data;
};
