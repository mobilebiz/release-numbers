require('dotenv').config();

// 実行時のパラメータを取得する
const args = process.argv.slice(2);
const DELETE = args[0] === 'delete';

// TwilioのアカウントSIDとトークンを環境変数から取得する
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

// 検索対象の日付を取得する（デフォルトは3ヶ月前）
const date = new Date();
date.setMonth(date.getMonth() - process.env.SINCE_MONTHS || 3);

// ログを色付きで表示する
const log = (message, color = '') => {
  if (color === 'red') {
    console.info('\x1b[31m%s\x1b[0m', message);
  } else if (color === 'green') {
    console.info('\x1b[32m%s\x1b[0m', message);
  } else if (color === 'yellow') {
    console.info('\x1b[33m%s\x1b[0m', message);
  } else if (color === 'blue') {
    console.info('\x1b[34m%s\x1b[0m', message);
  } else if (color === 'magenta') {
    console.info('\x1b[35m%s\x1b[0m', message);
  } else if (color === 'cyan') {
    console.info('\x1b[36m%s\x1b[0m', message);
  } else {
    console.info(message);
  }
}

// サブアカウントをクロールする
client.api.v2010.accounts.list()
  .then(async (accounts) => {
    for (let account of accounts) {
      log(`*** ${account.friendlyName}(${account.status}) ***`, account.status === 'active' ? '' : 'cyan');
      try {
        if (account.status === 'active') await execSubAccount(account);
        if (account.status === 'suspended') {
          // サスペンデッドの場合はサブアカウントを削除する
          if (DELETE) {
            await client.api.v2010.accounts(account.sid).update({ status: 'closed' });
            log(`delete: ${account.friendlyName}`, 'yellow');
          }
          // await execSubAccount(account);
          // // サスペンドに戻す
          // await client.api.v2010.accounts(account.sid).update({ status: 'suspended' });
        };        
      } catch (error) {
        log(`${error}`, 'red')
        // 処理は継続させる
        continue;
      }
    }
  // })
  // .catch(err => {
  //   log(`*** ERROR ***\n${err}`, 'red')
  });
  
  // サブアカウントごとに処理を実行する
  const execSubAccount = (account) => {
    return new Promise(async (resolve, reject) => {
      try {
        const subClient = require('twilio')(account.sid, account.authToken);
        const incomingPhoneNumbers = await subClient.incomingPhoneNumbers.list();
        for (let i of incomingPhoneNumbers) {
          let deleteFlag = true;
          // 電話番号のコールログを取得する
          deleteFlag = await getCallLogs(subClient, i.phoneNumber)
          if (i.phoneNumber.indexOf('+1') === 0) {
            // 米国番号の場合はメッセージログも取得する
            deleteFlag = await getMessageLogs(subClient, i.phoneNumber);
          }
          if (deleteFlag) {
            // 電話番号を削除する
            if (DELETE) {
              await subClient.incomingPhoneNumbers(i.sid).remove();
              log(`delete: ${i.phoneNumber}`, 'yellow');
            }
          }
        };
        resolve();      
      } catch (error) {
        reject(error);
      }
  });
};

// 電話番号のコールログを取得する
const getCallLogs = (subClient, phoneNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      const outgoingCallLogs = await subClient.calls.list({
        startTimeAfter: date, // 2023年1月1日以降
        from: phoneNumber
      });
      const incomingCallLogs = await subClient.calls.list({
        startTimeAfter: date, // 2023年1月1日以降
        to: phoneNumber
      });
      const callLogs = outgoingCallLogs.concat(incomingCallLogs);
      log(`call: ${phoneNumber} ${callLogs.length}件（in:${incomingCallLogs.length}, out:${outgoingCallLogs.length}）`, callLogs.length > 0 ? '' : 'red');
      resolve(callLogs.length === 0);
    } catch (error) {
      reject(error);
    }
  });
}

// メッセージの送信ログを取得する
const getMessageLogs = (subClient, phoneNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      const messageLogs = await subClient.messages.list({
        dateSentAfter: date, // 2023年1月1日以降
        from: phoneNumber
      });
      log(`message: ${phoneNumber} ${messageLogs.length}件`, messageLogs.length > 0 ? '' : 'red');
      resolve(messageLogs.length === 0);
    } catch (error) {
      reject(error);
    }
  });
}
