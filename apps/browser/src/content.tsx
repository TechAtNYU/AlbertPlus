import type { PlasmoCSConfig } from "plasmo";

let css = `
  .add-course-button {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    line-height: 1;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    padding: 8px 12px 8px 12px;
    border-radius: 5px;
    color: #57068C;
    border: 2px solid #57068C;
    background-color: transparent;
    transition: all 0.25s ease-in-out;
  }

  .add-course-button:hover {
    background-color: #57068C;
    color: #ffffff;
  }

  .add-course-button-saved {
    background-color: #57068C;
    color: #ffffff;
  }
`;

const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);

export const config: PlasmoCSConfig = {
  matches: ["https://*/*"],
  all_frames: true,
  run_at: "document_end",
};

console.log("[Plasmo] Course Helper content script loaded!");

// Helper function to parse day abbreviations into day enums
function parseDays(dayString: string | null): string[] {
  if (!dayString) return [];

  const dayMap: Record<string, string> = {
    M: "monday",
    T: "tuesday",
    W: "wednesday",
    R: "thursday",
    F: "friday",
    S: "saturday",
    U: "sunday",
  };

  const days: string[] = [];
  for (const char of dayString.toUpperCase()) {
    if (dayMap[char]) {
      days.push(dayMap[char]);
    }
  }
  return days;
}

// Helper function to determine current academic year and term
function getCurrentAcademicTerm(): { year: number; term: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

  // Academic year starts in September, so if it's before September, it's the previous year
  const academicYear = currentMonth >= 9 ? currentYear : currentYear - 1;

  // Determine term based on month
  let term: string;
  if (currentMonth >= 9 || currentMonth <= 1) {
    term = "fall";
  } else if (currentMonth >= 2 && currentMonth <= 5) {
    term = "spring";
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    term = "summer";
  } else {
    term = "j-term"; // January term
  }

  return { year: academicYear, term };
}

function parseCourse(row: HTMLTableRowElement) {
  // Find the course title div
  const courseTitleDiv = row.querySelector(".isSSS_CourseTitle p");
  if (!courseTitleDiv) {
    return null;
  }

  // Get the title attribute which has the course name
  const title =
    courseTitleDiv.getAttribute("title") ||
    courseTitleDiv.textContent?.split("\n")[0].trim() ||
    "";

  // Get the full text content to extract course code
  const fullText = courseTitleDiv.textContent || "";

  // Extract course code (e.g., "CSCI-UA 201")
  const codeMatch = fullText.match(/([A-Z]+-[A-Z]+)\s*(\d+)/);
  if (!codeMatch) {
    return null;
  }

  const courseCode = `${codeMatch[1]} ${codeMatch[2]}`
    .replace(/\s+/g, " ")
    .trim();

  const { year, term } = getCurrentAcademicTerm();

  let course = {
    courseCode: courseCode,
    title: title,
    year: year,
    term: term,
  };

  return course;
}

// Helper function to parse term string like "Spring 2025" into year and term
function parseTermString(
  termString: string
): { year: number; term: string } | null {
  const termMatch = termString.match(/^(\w+)\s+(\d{4})$/);
  if (!termMatch) return null;

  const [, termName, yearStr] = termMatch;
  const year = parseInt(yearStr);

  // Map term names to schema values
  const termMap: Record<string, string> = {
    Spring: "spring",
    Summer: "summer",
    Fall: "fall",
    Winter: "j-term",
    "J-term": "j-term",
  };

  const term = termMap[termName];
  if (!term) return null;

  return { year, term: term as "spring" | "summer" | "fall" | "j-term" };
}

function parseGradesTranscript(gradesContainer: Element) {
  const completedCourses: any[] = [];

  // Find all term sections (divs with h3 elements)
  const termSections = gradesContainer.querySelectorAll("div > h3");

  termSections.forEach((termHeader) => {
    const termString = termHeader.textContent?.trim();
    if (!termString) return;

    const termInfo = parseTermString(termString);
    if (!termInfo) return;

    // Find the table for this term (look for table in the same container as the h3)
    const termContainer = termHeader.parentElement;
    const table = termContainer?.querySelector("table.accordion-table");

    if (table && !table.querySelector('[id*="TEST"]')) {
      // Skip test credits tables
      // Parse course rows from the table
      const rows = table.querySelectorAll("tbody tr.accordion-row");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");

        if (cells.length >= 6) {
          const courseCode = cells[0]?.textContent?.trim() || "";
          const title = cells[1]?.textContent?.trim() || "";
          const instructor = cells[2]?.textContent?.trim() || "";
          const credits = cells[3]?.textContent?.trim() || "";
          const grade = cells[5]?.textContent?.trim() || "";

          if (courseCode && title) {
            // Parse course code to extract program and number
            const codeMatch = courseCode.match(
              /^([A-Z]+-[A-Z]+)\s*-\s*(\d+|[A-Z]+)$/
            );
            let program = "";
            let catalogNumber = "";

            if (codeMatch) {
              program = codeMatch[1];
              catalogNumber = codeMatch[2];
            }

            const course = {
              courseCode: courseCode,
              title: title,
              year: termInfo.year,
              term: termInfo.term,
              grade: grade.toLowerCase() as
                | "a"
                | "a-"
                | "b+"
                | "b"
                | "b-"
                | "c+"
                | "c"
                | "c-"
                | "d+"
                | "d"
                | "p"
                | "f"
                | "w",
            };

            if (grade) {
              completedCourses.push(course);
            }
          }
        }
      });
    }
  });

  return completedCourses;
}

function waitForTable(
  selector: string,
  callback: (table: HTMLTableElement) => void
) {
  const observer = new MutationObserver(() => {
    const table = document.querySelector<HTMLTableElement>(selector);
    if (table) {
      observer.disconnect();
      callback(table);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Also monitor for grades/transcript sections
function checkForGradesContainers() {
  const gradesContainers = document.querySelectorAll(".isSSS_GradesTwrp");
  console.log(gradesContainers.length);
  if (gradesContainers.length > 0) {
    const allCompletedCourses: any[] = [];

    gradesContainers.forEach((container) => {
      const completedCourses = parseGradesTranscript(container);
      allCompletedCourses.push(...completedCourses);
    });

    console.log("Completed courses:", allCompletedCourses);
    if (allCompletedCourses.length > 0) {
      chrome.runtime.sendMessage({
        type: "SAVE_COMPLETED_COURSES",
        payload: allCompletedCourses,
      });
    }
  }
}

function parseCourseSearch(course: HTMLElement) {
  course.classList.add("extension-modified");
  course
    .querySelectorAll('[id^="win0divSELECT_BUTTON$"]')
    .forEach((button: HTMLElement) => {
      button.style.display = "flex";
      button.style.gap = "10px";
      button.style.justifyContent = "center";
      let saveCourseButton = document.createElement("div") as HTMLElement;
      saveCourseButton.textContent = "Save Course to A+";
      saveCourseButton.className = "add-course-button";

      let number =
        button.children[0].children[0].textContent
          .replace("Select Class #", "")
          .trim() || "";

      saveCourseButton.onclick = () => {
        if (saveCourseButton.className.includes("add-course-button-saved")) {
          return;
        }
        saveCourseButton.className =
          "add-course-button add-course-button-saved";
        saveCourseButton.textContent = "Saved to A+";

        let courseTitleElement =
          course.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.querySelector(
            "b"
          );

        let courseSectionInfo = course.querySelector(
          '[id^="COURSE' + number + 'nyu"]'
        ) as HTMLElement;

        let sectionTopic =
          courseSectionInfo.parentElement.children[0]
            .querySelector("b")
            ?.textContent.replace("Topic:", "")
            .trim() || "";

        let yearTerm =
          course.querySelector('[id^="NYU_CLS_TRM_DESCR$"]')?.textContent || "";

        let waitlistNum = 0;

        let status = courseSectionInfo.children[3].textContent.trim();
        if (status == "Requires Department Consent") {
          status = courseSectionInfo.children[4].textContent
            .replace("Class Status: ", "")
            .trim();
        } else {
          status = courseSectionInfo.children[3].textContent
            .replace("Class Status: ", "")
            .trim();
        }

        if (status.includes("Wait List")) {
          status = "waitlist";
          waitlistNum = parseInt(status.match(/\d+/)?.[0] || "0");
        } else if (status.includes("Closed")) {
          status = "closed";
        } else if (status.includes("Open")) {
          status = "open";
        }

        let courseDetails = [...courseSectionInfo.parentElement.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent.trim())
          .filter(Boolean)[0];

        const regex =
          /([A-Za-z,]+)\s*(\d{1,2}\.\d{2})\s*([APap][Mm])\s*-\s*(\d{1,2}\.\d{2})\s*([APap][Mm])\s*at\s*(.*?)\s*with\s*(.*)/;

        const match = courseDetails.match(regex);
        let daysStr: string,
          startTime: string,
          startMeridiem: string,
          endTime: string,
          endMeridiem: string,
          location: string,
          instructor: string;

        if (match) {
          [
            ,
            daysStr,
            startTime,
            startMeridiem,
            endTime,
            endMeridiem,
            location,
            instructor,
          ] = match;
        }

        const dayMap = {
          Mon: "monday",
          Tue: "tuesday",
          Wed: "wednesday",
          Thu: "thursday",
          Fri: "friday",
          Sat: "saturday",
          Sun: "sunday",
        };

        const to24 = (time, meridiem) => {
          let [hour, minute] = time.split(".").map(Number);
          if (meridiem.toUpperCase() === "PM" && hour < 12) hour += 12;
          if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;
          return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        };

        let courseInfo = {
          courseCode:
            courseTitleElement.innerHTML
              .match(/^([A-Z-]+\s*\d+)/)?.[1]
              .replace(/\s+/g, " ")
              .trim() || "",
          classNumber: number,
          title:
            courseTitleElement.innerHTML
              .replace(/^[A-Z-]+\s*\d+\s+/, "")
              .replace(/<br>.*/i, "")
              .trim() || "",
          section:
            courseSectionInfo.children[2].textContent
              .replace("Section: ", "")
              .trim() || "",
          year: yearTerm.split(" ")[0],
          term: yearTerm.split(" ")[1] as
            | "spring"
            | "summer"
            | "fall"
            | "j-term",
          instructor: instructor || "",
          location: location || "",
          days: daysStr.split(",").map((d) => dayMap[d.trim()]),
          startTime: to24(startTime, startMeridiem) || "",
          endTime: to24(endTime, endMeridiem) || "",
          status: status,
          waitlistNum: waitlistNum,
        };
        chrome.runtime.sendMessage({
          type: "SAVE_COURSE_SEARCH",
          payload: courseInfo,
        });
      };
      button.appendChild(saveCourseButton);
    });
}

// Check immediately and also set up monitoring
checkForGradesContainers();

// Monitor for new grades containers appearing
const gradesObserver = new MutationObserver(() => {
  checkForGradesContainers();
});

const courseSearchObserver = new MutationObserver(() => {
  courseSearchObserver.disconnect();
  const courses = document.querySelectorAll(
    '[id^="win0divSELECT_COURSE_row$"]'
  );
  courses.forEach((course) => {
    if (!course.classList.contains("extension-modified")) {
      parseCourseSearch(course as HTMLElement);
    }
  });
  courseSearchObserver.observe(target, { childList: true, subtree: true });
});

// Removed local storage - all data now stored in Convex

const target = document.body;

waitForTable("#isSSS_ShCtSchTable", (table) => {
  let enrolledCourses = [];
  for (let index = 1; index < table.rows.length; index++) {
    let course = parseCourse(table.rows[index]);
    if (course) {
      enrolledCourses.push(course);
    }
  }
  chrome.runtime.sendMessage({
    type: "SAVE_ENROLLED_COURSES",
    payload: enrolledCourses,
  });
});

if (window.top !== window) {
  courseSearchObserver.observe(target, { childList: true, subtree: true });
} else {
  gradesObserver.observe(document.body, { childList: true, subtree: true });
}
