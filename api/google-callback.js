'use strict';
const handler=require('./drive');
module.exports=(req,res)=>{req.query={...req.query,action:'callback'};return handler(req,res)};
