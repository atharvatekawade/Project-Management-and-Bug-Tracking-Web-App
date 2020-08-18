CREATE DATABASE bugs;

CREATE TABLE client (
	client_id SERIAL  PRIMARY KEY,
	name VARCHAR (255),
    email VARCHAR(255),
    password VARCHAR (255),
    phone VARCHAR(255),
    token VARCHAR(255),
    valid VARCHAR DEFAULT 'Not',
	UNIQUE(name)
);

CREATE TABLE emp (
	emp_id SERIAL  PRIMARY KEY,
	name VARCHAR (255),
    email VARCHAR (255),
    phone VARCHAR (255),
    joined VARCHAR (255),
    branch VARCHAR (255)
);

CREATE TABLE project (
    project_id SERIAL  PRIMARY KEY,
    title VARCHAR (255),
    description VARCHAR(1000),
    emp_id integer REFERENCES emp ON DELETE CASCADE,
    client_id integer REFERENCES client ON DELETE CASCADE,
    start VARCHAR(255),
    deadline VARCHAR(255),
    enddate VARCHAR(255) DEFAULT 'Not'
);

CREATE TABLE bug (
    bug_id SERIAL  PRIMARY KEY,
    title VARCHAR (255),
    description VARCHAR(1000),
    project_id integer REFERENCES project ON DELETE CASCADE,
    start VARCHAR(255),
    enddate VARCHAR(255) DEFAULT 'Not',
    remarks VARCHAR(255) DEFAULT 'Not'
);

CREATE TABLE message (
    message_id SERIAL  PRIMARY KEY,
    project_id integer REFERENCES project ON DELETE CASCADE,
    deadline VARCHAR(255),
    reply VARCHAR(255) DEFAULT 'Not'
);







