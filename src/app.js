const express = require('express');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

const port = process.env.PORT || 3000
const redisPort = process.env.REDIS_PORT || 6379
const redisHost = process.env.REDIS_HOST || 'localhost'

// Setup Redis
const redisClient = redis.createClient(redisPort, redisHost, redis);
redisClient.on('connect', () => {
    console.log(`Redis is connected`)
})

redisClient.connect();
const app = express();


app.get('/tasks/:id', async (req, res) => {
    var taskId = req.params.id;
    var data = await redisClient.get(taskId)
    if (data === ''){
        res.status(200).json({
            status: 'INPROGRESS'
        })
    } else {
        res.status(200).json({
            status: 'COMPLETED',
            data: data
        })
    }
});


// Client request for long running task
// First it generates the taskId and store it into 
// the redis for tracking purpose
app.post('/tasks', async (req, res) => {
    console.log(`Long running task is requested`);
    var taskId = uuidv4();
    console.log(`Generate taskId ${taskId}`);
    await redisClient.set(taskId, '')
    longRunningTask(taskId)
        .then((data) => {
            redisClient.set(taskId, data)
        })
    res.status(201).json({
        taskId: taskId
    })
})

app.listen(port, ()=> {
    console.log(`Server is started at port ${port}`);
});

// Simulate long running task which calculate something
// and take long time 
function longRunningTask(){
    return new Promise(resolved => {
        setTimeout(() => {
            console.log(`Task ended`)
            resolved("Processed Data");
        }, 60000);
    });
}

