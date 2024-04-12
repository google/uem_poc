# Sample UEM App for Policy API
This Angular Application is meant to represent a sample Application which uses the [Chrome Policy API](https://developers.google.com/chrome/policy/guides/overview) for managing ChromeOS devices.
The application demonstrates how to:
1. Use the [Policy Schemas List call](https://developers.google.com/chrome/policy/reference/rest/v1/customers.policySchemas/list) to auto generate the UI (Avoids the need to add individual policies as they are released. The policies will be available on the UI as soon as a new policy is released)
2. Use the [Batch modify API call](https://developers.google.com/chrome/policy/reference/rest/v1/customers.policies.orgunits/batchModify) to update policies (One API call can be used to update multiple policies. This will reduce the number of required API calls. This helps with any Quota exceeded issues)
3. Use the [Batch Inherit API call](https://developers.google.com/chrome/policy/reference/rest/v1/customers.policies.orgunits/batchInherit) to inherit policies from parent (Inherit makes it easier for customers to set policies as per the parent OU instead of updating to the actual value. One API call can be used to inherit multiple policies. This will reduce the number of required API calls. This helps with any Quota exceeded issues)

The above listed items are recommended to be implemented by the Policy API team when using the API.

The application currently renders policies under the `User Application Settings` policy category. The work required to render other policy categories is in progress. The application can partially render policies under other policy categories. 

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.5.

## Pending/Upcoming Tasks
- Add support for other categories of Policies
- Add support for groups
- Add retry and exponential backoff logic in case of API call failures related to API Quota limits
- Add unit tests
- Add better comments where needed

## How to use this app
### Prerequisites
Follow the [setup steps](https://developers.google.com/chrome/policy/guides/setup) till Step 3. Use [Option 1](https://developers.google.com/chrome/policy/guides/setup#expandable-1) to create the `OAuth client ID`. You can configure this client ID in the `google-auth-service.ts` file.

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Usage
- Login to the application with the admin user of your domain
- After a successful login you will see the policies available which are filtered by the Org Unit and Policy Category
- You can change the selected Org Unit and Policy Category according to what you want to view
- If you modify a policy then you can save the changes by hitting the save button
- If you want to inherit a particular policy from the parent OU then you can use the `Inherit` button and click `Save` to save the changes. Please note that the inherit button will only be enabled if the policy value is not inherited
-  The `Save` button will save all the policy modifications and policy inherits done on the page