#!/usr/bin/env bash

clear
pm2 delete pager
SCRIPTPATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPTPATH/../server
pm2 start pager.js
pm2 logs pager
