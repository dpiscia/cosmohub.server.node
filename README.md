Node.js server implementation,


It uses express.js, socket.io, knex.js among other npm modules

It provides the following RESTFUL apis:

// Jobs API

/api_node/jobs/:id/:all

it returns the job information and the children jobs according to recursive level specified by parameter all

if no id is specified, all the super id jpobs will be provided

/api_node/qc/:id'

Return quality contrl information realted to job ID

/api_node/prods

Return production jobs list

/api_node/jobs/prod/:id

return production unique job info


api/str_query?table&fields&clauses&limit
    Execute structured query

/api_node/raw_query

Execute raw query

//login/logout/register points

/api_node/logout

logout api

/api_node/register

register api


/signup/check/username

check if username already exists

/api_node/login

login api