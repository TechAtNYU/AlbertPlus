---
title: "Data Flow"
---

Understanding the flow of data is crucial to comprehending how AlbertPlus works. The platform is designed around a robust data pipeline that ensures course information is accurate, up-to-date, and delivered efficiently to the user.

## Course Data Pipeline

The primary data pipeline is responsible for collecting, storing, and serving course and program information.

### Static Course & Program Data (Manual Trigger)

1. **Scraping (Cloudflare Worker)**
   - **Admin Trigger**: Admin users initiate scraping by calling Convex actions (`api.scraper.triggerMajorsScraping` or `api.scraper.triggerCoursesScraping`).
   - **Authenticated Request**: The Convex action makes a POST request to the scraper's HTTP endpoints (`/api/trigger-majors` or `/api/trigger-courses`) with the `CONVEX_API_KEY` in the `X-API-KEY` header.
   - **API Key Validation**: The scraper validates the API key to ensure the request is from the trusted Convex backend.
   - **Discovery**: The scraper discovers the URLs for all available programs or courses from NYU's public course catalog.
   - **Job Queuing**: For each discovered program or course, a new job is added to a Cloudflare Queue. This allows for resilient and distributed processing.
   - **Data Extraction**: Each job in the queue is processed by the worker, which scrapes the detailed information for a specific course or program.
   - **Upsert to Backend**: The scraped data is sent back to the Convex backend via authenticated HTTP endpoints.

### Dynamic Course Offerings Data (Scheduled)

1. **Automated Scraping (Cloudflare Worker Cronjob)**
   - **Scheduled Trigger**: A cronjob runs at regular intervals (configured in `wrangler.jsonc`).
   - **Config Check**: The worker reads app configuration from Convex to determine which terms to scrape (`is_scrape_current`, `is_scrape_next`, along with term/year information).
   - **Albert Public Search**: For each enabled term, the worker scrapes Albert's public class search to discover all course offering URLs.
   - **Job Queuing**: Each course offering URL is added to the queue as a `course-offering` job with metadata about the term and year.
   - **Section Details**: Each job scrapes detailed information including:
     - Class number, section, and status (open/closed/waitlist)
     - Instructor names and location
     - Meeting days, start time, and end time
     - Corequisite relationships
   - **Batch Upsert**: Scraped course offerings are sent to Convex in batches via the `/api/courseOfferings/upsert` endpoint.

2. **Backend Processing (Convex)**
   - **Data Reception**: The Convex backend receives the scraped data from the Cloudflare Worker.
   - **Database Storage**: The data is upserted into the Convex database, ensuring that existing records are updated and new ones are created. This includes courses, programs, requirements, prerequisites, and course offerings.
   - **Real-time Updates**: Any clients connected to the Convex backend (such as the web app) will receive real-time updates as the new data is written to the database.

3. **Client-side Consumption (Web App & Browser Extension)**
   - **Data Fetching**: The Next.js web app and the browser extension query the Convex backend to fetch course, program, and course offering data.
   - **User Interface**: The data is then rendered in the user interface, allowing students to browse the course catalog, view program requirements, check real-time class availability, and build their schedules.

## Degree Progress Report Parsing

Another important data flow involves the parsing of a student's degree progress report.

1. **File Upload**: The user uploads their degree progress report (in PDF format) through the web application.
2. **Client-side Parsing**: The PDF is parsed directly in the browser using the `pdfjs-dist` library. This approach enhances privacy as the user's academic records are not sent to the server.
3. **Data Extraction**: The parsed text is then processed to extract the student's completed courses and grades.
4. **Backend Storage**: The extracted course information is stored in the `userCourses` table in the Convex database, associated with the authenticated user's ID.
5. **Degree Audit**: This stored data can then be used to compare against program requirements, providing the student with an audit of their academic progress.
