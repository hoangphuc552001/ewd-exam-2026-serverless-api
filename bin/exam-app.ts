#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ExamStack } from '../lib/exam-stack';
 
const app = new cdk.App();
new ExamStack(app, 'ExamStk', {
  env: { region: 'eu-west-1' },
});