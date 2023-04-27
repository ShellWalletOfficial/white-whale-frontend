import BondingActions from 'components/Pages/BondingActions'
import { ActionType } from 'components/Pages/Dashboard/BondingOverview'

const UnbondPage = () => <BondingActions globalAction={ActionType.unbond} />

export default UnbondPage
