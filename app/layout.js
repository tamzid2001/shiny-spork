import "./globals.css";
export const metadata = {
  title: "Tamzid Ullah's Pantry Tracker",
  description: "Headstarter Project 2",
};

import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
 // or `v1X-appRouter` if you are using Next.js v1X

 export default function RootLayout(props) {
   return (
     <html lang="en">
       <body>
+        <AppRouterCacheProvider>
           {props.children}
+        </AppRouterCacheProvider>
       </body>
     </html>
   );
 }

