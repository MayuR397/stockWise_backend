import express from 'express';
import { startScheduledTask, stopScheduledTask, stockDataArray, commonStockNames } from '../scripts/puppeteerScript.js';

let isTaskRunning = false;

const router = express.Router();

router.get('/start-script', (req, res) => {
  if (!isTaskRunning) {
    startScheduledTask();
    isTaskRunning = true;
    res.send('Script started successfully.');
  } else {
    res.send('Script is already running.');
  }
});

router.get('/stop-script', (req, res) => {
  if (isTaskRunning) {
    stopScheduledTask();
    isTaskRunning = false;
    res.send('Script stopped successfully.');
  } else {
    res.send('Script is not running.');
  }
});

router.get('/stocks', (req, res) => {
  res.json(stockDataArray);
});

router.get('/common-stocks', (req, res) => {
  res.json(commonStockNames);
});

export default router;
