import { css } from "@emotion/react";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";
import styles from '../styles/Spinner.module.scss';

const override = css`
  display: block;
  margin: 0 auto;
`;

function Spinner({color, loading, connecting}) {
  return (
    <div className={styles.spinner}>
        <div className="sweet-loading" className={styles.centerInner}>
            <ClimbingBoxLoader color={color || '#ff6b6b'} loading={loading} css={override} size={15} />
            {connecting && <p className={styles.text}>Loading...</p>}
        </div>
    </div>
  );
}

export default Spinner;