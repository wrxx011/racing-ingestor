import * as cheerio from "cheerio";

async function loadWebsite(url: URL) {
  // fetch the html of the website
  const res = await fetch(url);
  const rootHTML = await res.text();

  // load the html into cheerio object
  const $ = cheerio.load(rootHTML);
  return $;
}

export async function scrapeSchedule(url: string) {
  const cheerioRoot = await loadWebsite(new URL(url));
  let itinerayData = getItinerayData(cheerioRoot);
  const noDays = getAmountOfDays(cheerioRoot);
  let days: day[] = [];

  for (let i = 0; i < noDays; i++) {
    days.push(fetchDay(i, cheerioRoot));
  }

  const parsedItinerayData = { ...itinerayData, days }
  

  return parsedItinerayData;
}

function getItinerayData($) {
  // load the header of the itineray
  const scheduleHeader = $("div.faq-layout-view__header > cosmos-text-14-3-3");

  // regexes for extracting the data
  const regexVersionNumber = new RegExp(/(?<=Version\s)V?\d+(\.\d+)*/gm);
  const regexScheduleDate = new RegExp(/(?<=V\d\s)\d+.\d+.\d+/gim);
  const regexTimezone = new RegExp(/(?<=All\sTimes\s)\w*\s[-+]\d+/gim);

  // search for the values
  const schedVersion = scheduleHeader.text().match(regexVersionNumber) || ["0"];
  const schedDate = scheduleHeader.text().match(regexScheduleDate) || [""];
  const schedTZ = scheduleHeader.text().match(regexTimezone) || [""];

  return {
    version: schedVersion[0],
    itinerayDate: schedDate[0],
    timezone: schedTZ[0].replace(" ", ""),
  };
}

function getAmountOfDays($) {
  let amount: number = 0;
  const schedule = $("div.faq-layout-view__faqs");
  schedule.find("div.faq-view").each(() => {
    amount++;
  });
  return amount;
}

interface day {
  dayOfTheWeek: string;
  date: string;
  stages: stage[];
}
interface stage {
  stageStartTime: string;
  specialStageNumber: string;
  stageName: string;
  stageLength: string;
}

function fetchDay(indexOfDay: number, $) {
  const day = $("div.faq-view").eq(indexOfDay);

  const stages: string[] = [];
  let parsedStages: stage[] = [];

  // fetch the name of the day eg. Friday, 01 January
  const dayHeader = day
    .find("button > cosmos-text-14-3-3")
    .text()
    .trim()
    .split(", ");

  // save all the stages in the picked day to a stages array
  day.find("li").each((i, elem) => {
    stages[i] = $(elem).text();
  });

  // regex for extracting the stages data
  const regexTime = new RegExp(/^\d{2}:\d{2}/);
  const regexStageNumber = new RegExp(
    /(ceremonial\sstart|shakedown|SS\d+|SSS\d+)/i,
  );
  const regexStageName = new RegExp(
    /(?<=(?:Shakedown.|SSS?\d+)[\s-]+(?=\w)).+?(?=\s*\()/gi,
  );
  const regexStageLen = new RegExp(/\d{1,2}\.\d{1,2}/gim);

  // extract the data on each element in the array
  stages.forEach((element) => {
    const time = element.match(regexTime) || [""];
    const stageNum = element.match(regexStageNumber) || [""];
    const stageName = element.match(regexStageName) || [""];
    const stageLength = element.match(regexStageLen) || [""];

    parsedStages.push({
      stageStartTime: time[0],
      specialStageNumber: stageNum[0],
      stageName: stageName[0],
      stageLength: stageLength[0],
    });
  });

  return {
    dayOfTheWeek: dayHeader[0],
    date: dayHeader[1],
    stages: parsedStages,
  };
}
