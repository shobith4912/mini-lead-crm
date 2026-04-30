# Mini Lead CRM API

This project is a simple backend API built for managing leads in a sales pipeline. It was developed as part of a backend engineering assignment.

The API allows creating, updating, deleting, and tracking leads through different stages.

---

## Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose

---

## How to Run the Project

1. Clone the repository
   git clone https://github.com/shobith4912/mini-lead-crm.git

2. Go into the project folder
   cd mini-lead-crm

3. Install dependencies
   npm install

4. Start the server
   node index.js

The server will run on
http://localhost:3000

---

## Features

Level 1

* Create a lead
* Get all leads
* Get lead by id
* Update a lead
* Delete a lead
* Update lead status with proper rules

Level 2

* Bulk create leads
* Bulk update leads
* Partial success handling for bulk operations

Level 3

* Caching for GET lead by id
* Cache automatically cleared on update, delete, and status change

---

## Lead Status Flow

NEW moves to CONTACTED
CONTACTED moves to QUALIFIED
QUALIFIED moves to CONVERTED

From any stage except CONVERTED, lead can move to LOST

CONVERTED and LOST are final stages

Invalid transitions return an error

---

## API Endpoints

POST /leads
GET /leads
GET /leads/:id
PUT /leads/:id
DELETE /leads/:id
PATCH /leads/:id/status

POST /leads/bulk
PUT /leads/bulk

---

## Caching

GET /leads/:id is cached for faster response

Cache duration is 60 seconds

Cache is cleared when

* lead is updated
* lead is deleted
* status is changed

---

## Project Structure

mini-lead-crm
models
Lead.js
index.js
package.json

---

## Notes

This project focuses on correct functionality and clean implementation.
In a real-world application, caching can be improved using Redis and additional features like pagination and authentication can be added.

---

## Author

Shobith Kommaddi
Email: [shobithkommaddi@gmail.com](mailto:shobithkommaddi@gmail.com)
