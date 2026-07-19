import SubscribeMail from './src/shared/database/models/subscribeMail.model';

const doc = new SubscribeMail({ userMail: {} as any });
console.log('Document userMail property value:', doc.userMail);
doc.validate()
    .then(() => {
        console.log('Validation passed successfully!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Validation failed with error:', err);
        process.exit(1);
    });
