import { scrapeSchedule } from "./scrape";
import { sql, SQL } from "bun";
import { formatISO } from "date-fns";

const TEMP_URL =
  "https://www.wrc.com/en/events/wrc-secto-rally-finland-2026/itinerary-wrc-secto-rally-finland-2026";
const TEMP_ID = "wrc-secto-rally-finland-2026";

const schedule = await scrapeSchedule(TEMP_URL);

schedule.days.forEach(async (day) => {
  day.stages.forEach(async (stage) => {
    const currDate = new Date();
    const stageTimestamp =
      currDate.getFullYear() +
      " " +
      day.date +
      " " +
      stage.stageStartTime +
      " " +
      schedule.timezone;
    const parsedStageTimestamp = formatISO(Date.parse(stageTimestamp));
    const ret = await sql`
    INSERT INTO sessions (session_type, session_name, scheduled_at, event_id, session_no)
    VALUES ('special_stage', ${stage.stageName}, ${parsedStageTimestamp}, ${TEMP_ID}, ${stage.specialStageNumber})
    RETURNING *
    `;
    console.log(ret);
  });
});
