import WelcomeBanner from "../WelcomeBanner.jsx";
import LocationDashboardStats from "../LocationDashboardStats.jsx";
import QuickStats from "../QuickStats.jsx";
import QuickNavGrid from "../QuickNavGrid.jsx";
import SetupChecklist from "../SetupChecklist.jsx";
import { DashboardPageWrap } from "../DashboardShell.jsx";
import styles from "../../../pages/DashboardPage.module.css";

/** Original framework home — enhanced layout shell */
export default function DefaultWorkspaceDashboard() {
  return (
    <DashboardPageWrap>
      <div className={styles.stack}>
        <WelcomeBanner />
        <LocationDashboardStats />
        <QuickStats />
        <QuickNavGrid />
        <SetupChecklist />
      </div>
    </DashboardPageWrap>
  );
}
