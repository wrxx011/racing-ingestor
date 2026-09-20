import { scrapeSchedule } from "./scrape";
import { sql, SQL } from "bun";
import { formatISO } from "date-fns";

async function pushDataToDB(url: string) {
  const eventRegex = /(?<=\/events.)\S*(?=\/)/gi;
  const event_id = url.match(eventRegex) || [""];

  const schedule = await scrapeSchedule(url);

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
    VALUES ('special_stage', ${stage.stageName}, ${parsedStageTimestamp}, ${event_id}, ${stage.specialStageNumber})
    ON CONFLICT (event_id, session_no) DO NOTHING
    RETURNING *
    `;
      console.log(ret);
    });
  });
}

pushDataToDB(Bun.argv[2] || "");
