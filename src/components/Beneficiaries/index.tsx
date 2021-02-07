import classnames from 'classnames';
import * as React from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import {
    beneficiariesCreateData,
    beneficiariesDelete,
    Beneficiary,
    BeneficiaryBank,
    memberLevelsFetch,
    selectBeneficiaries,
    selectBeneficiariesActivateSuccess,
    selectBeneficiariesCreate,
    selectBeneficiariesCreateSuccess,
    selectMemberLevels,
    selectMobileDeviceState,
    selectUserInfo,
    sendError,
} from '../../modules';
import { usePrevious } from '../../hooks';
import { ChevronIcon } from '../../assets/images/ChevronIcon';
import { PlusIcon } from '../../assets/images/PlusIcon';
import { TipIcon } from '../../assets/images/TipIcon';
import { TrashBin } from '../../assets/images/TrashBin';
import { BeneficiariesActivateModal } from './BeneficiariesActivateModal';
import { BeneficiariesAddModal } from './BeneficiariesAddModal';
import { BeneficiariesFailAddModal } from './BeneficiariesFailAddModal';


interface OwnProps {
    currency: string;
    type: 'fiat' | 'coin';
    onChangeValue: (beneficiary: Beneficiary) => void;
}

const defaultBeneficiary: Beneficiary = {
    id: 0,
    currency: '',
    name: '',
    state: '',
    data: {
        address: '',
    },
};

type Props = OwnProps;

const BeneficiariesComponent: React.FC<Props> = (props: Props) => {
    const [currentWithdrawalBeneficiary, setWithdrawalBeneficiary] = React.useState(defaultBeneficiary);
    const [isOpenAddressModal, setAddressModalState] = React.useState(false);
    const [isOpenConfirmationModal, setConfirmationModalState] = React.useState(false);
    const [isOpenFailModal, setFailModalState] = React.useState(false);
    const [isOpenTip, setTipState] = React.useState(false);
    const [isOpenDropdown, toggleDropdown] = React.useState(false);

    const { currency, type, onChangeValue } = props;

    const { formatMessage } = useIntl();
    const dispatch = useDispatch();

    /*    selectors    */
    const beneficiaries = useSelector(selectBeneficiaries);
    const beneficiariesAddData = useSelector(selectBeneficiariesCreate);
    const beneficiariesAddSuccess = useSelector(selectBeneficiariesCreateSuccess);
    const beneficiariesActivateSuccess = useSelector(selectBeneficiariesActivateSuccess);
    const memberLevels = useSelector(selectMemberLevels);
    const userData = useSelector(selectUserInfo);
    const isMobileDevice = useSelector(selectMobileDeviceState);
    /*    ---------    */

    React.useEffect(() => {
        if (currency && beneficiaries) {
            handleSetCurrentAddressOnUpdate(beneficiaries);
        }

        if (!memberLevels) {
            dispatch(memberLevelsFetch());
        }
    }, []);

    const prevCurrency = usePrevious(currency);
    const prevBeneficiaries = usePrevious(beneficiaries);
    const prevBeneficiariesAddSuccess = usePrevious(beneficiariesAddSuccess);
    const prevBenefiariesActivateSuccess = usePrevious(beneficiariesActivateSuccess);

    React.useEffect(() => {
        if ((props.currency && prevCurrency !== props.currency)
            || (beneficiaries.length && beneficiaries !== prevBeneficiaries)) {
            handleSetCurrentAddressOnUpdate(beneficiaries);
        }

        if (!prevBeneficiariesAddSuccess && beneficiariesAddSuccess) {
            setAddressModalState(false);
            setConfirmationModalState(true);
        }

        if (!prevBenefiariesActivateSuccess && beneficiariesActivateSuccess) {
            setConfirmationModalState(false);
        }
    }, [beneficiariesAddSuccess, currency, prevBeneficiariesAddSuccess, prevBenefiariesActivateSuccess, beneficiariesActivateSuccess]);

    const handleDeleteAddress = React.useCallback((item: Beneficiary) => () => {
        dispatch(beneficiariesDelete({ id: item.id }));
    }, []);

    const handleClickSelectAddress = React.useCallback((item: Beneficiary) => () => {
        if (item.state && item.state.toLowerCase() === 'pending') {
            dispatch(beneficiariesCreateData(item));
            setConfirmationModalState(true);
        } else {
            handleSetCurrentAddress(item);
        }
    }, []);

    const handleSetCurrentAddress = React.useCallback((item: Beneficiary) => {
        if (item.data) {
            setWithdrawalBeneficiary(item);
            toggleDropdown(!isOpenDropdown);
            onChangeValue(item);
        }
    }, []);

    const handleFilterByState = React.useCallback((beneficiariesList: Beneficiary[], filter: string | string[]) => {
        if (beneficiariesList.length) {
            return beneficiariesList.filter(item => filter.includes(item.state.toLowerCase()));
        }

        return [];
    }, []);

    const handleClickToggleAddAddressModal = React.useCallback(() => () => {
        if (memberLevels && (userData.level < memberLevels.withdraw.minimum_level)) {
            setFailModalState(true);
        } else if (beneficiaries && beneficiaries.length >= 10) {
            dispatch(sendError({
                error: { message: ['error.beneficiaries.max10.addresses'] },
                processingType: 'alert',
            }));
        } else {
            setAddressModalState(true);
        }
    }, [beneficiaries]);

    const handleSetCurrentAddressOnUpdate = React.useCallback((beneficiariesList: Beneficiary[]) => {
        let filteredByState = handleFilterByState(beneficiariesList, 'active');

        if (!filteredByState.length) {
            filteredByState = handleFilterByState(beneficiariesList, 'pending');
        }

        if (filteredByState.length) {
            handleSetCurrentAddress(filteredByState[0]);
        }
    }, []);

    const renderAddAddress = React.useMemo(() => {
        return (
            <div className="pg-beneficiaries__add" onClick={handleClickToggleAddAddressModal()}>
                <span className="pg-beneficiaries__add__label">
                    {formatMessage({ id: 'page.body.wallets.beneficiaries.addAddress' })}
                </span>
                <PlusIcon className="pg-beneficiaries__add__icon" />
            </div>
        );
    }, [formatMessage]);

    const renderDropdownTipCryptoNote = React.useCallback((note: string) => {
        return (
            <div className="tip__content__block">
                <span className="tip__content__block__label">{formatMessage({ id: 'page.body.wallets.beneficiaries.tipDescription' })}</span>
                <span className="tip__content__block__value">{note}</span>
            </div>
        );
    }, []);

    const renderDropdownTipCrypto = React.useCallback((currentWithdrawalBeneficiary: Beneficiary) => {
        if (currentWithdrawalBeneficiary) {
            return (
                <div className="pg-beneficiaries__dropdown__tip tip">
                    <div className="tip__content">
                        <div className="tip__content__block">
                            <span className="tip__content__block__label">{formatMessage({ id: 'page.body.wallets.beneficiaries.tipAddress' })}</span>
                            <span className="tip__content__block__value">{currentWithdrawalBeneficiary.data.address}</span>
                        </div>
                        <div className="tip__content__block">
                            <span className="tip__content__block__label">{formatMessage({ id: 'page.body.wallets.beneficiaries.tipName' })}</span>
                            <span className="tip__content__block__value">{currentWithdrawalBeneficiary.name}</span>
                        </div>
                        {currentWithdrawalBeneficiary.description && renderDropdownTipCryptoNote(currentWithdrawalBeneficiary.description)}
                    </div>
                </div>
            );
        }

        return null;
    }, []);

    const renderDropdownTipFiatDescription = (description: string) => {
        return (
            <div className="tip__content__block">
                <span className="tip__content__block__label">{formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.fiat.description' })}</span>
                <span className="tip__content__block__value">{description}</span>
            </div>
        );
    };

    const renderDropdownTipFiat = React.useCallback((currentWithdrawalBeneficiary: Beneficiary) => {
        if (currentWithdrawalBeneficiary) {
            return (
                <div className="pg-beneficiaries__dropdown__tip tip fiat-tip">
                    <div className="tip__content">
                        <div className="tip__content__block">
                            <span className="tip__content__block__label">
                                {formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.fiat.name' })}
                            </span>
                            <span className="tip__content__block__value">
                                {currentWithdrawalBeneficiary.name}
                            </span>
                        </div>
                        {currentWithdrawalBeneficiary.description && renderDropdownTipFiatDescription(currentWithdrawalBeneficiary.description)}
                        <div className="tip__content__block">
                            <span className="tip__content__block__label">
                                {formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.fiat.account' })}
                            </span>
                            <span className="tip__content__block__value">
                                {(currentWithdrawalBeneficiary.data as BeneficiaryBank).account_number}
                            </span>
                        </div>
                        <div className="tip__content__block">
                              <span className="tip__content__block__label">
                                  {formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.fiat.bankOfBeneficiary' })}
                              </span>
                            <span className="tip__content__block__value">
                                {(currentWithdrawalBeneficiary.data as BeneficiaryBank).bank_name}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    }, [isOpenDropdown]);


    const renderAddressDropdown = React.useCallback((beneficiariesList: Beneficiary[], currentWithdrawalBeneficiary: Beneficiary, type: 'fiat' | 'coin') => {
        const isPending = currentWithdrawalBeneficiary.state && currentWithdrawalBeneficiary.state.toLowerCase() === 'pending';

        const dropdownClassName = classnames('pg-beneficiaries__dropdown', {
            'pg-beneficiaries__dropdown--open': isOpenDropdown,
        });

        if (type === 'fiat') {
            return (
                <div className={dropdownClassName}>
                    <div className="pg-beneficiaries__dropdown__select fiat-select select" onClick={e => toggleDropdown(!isOpenDropdown)}>
                        <div className="select__left">
                            <span className="select__left__title">{formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.fiat.name' })}</span>
                            <span className="select__left__address">{currentWithdrawalBeneficiary.name}</span>
                            <span className="select__left__title">{formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.fiat.fullName' })}</span>
                            <span className="select__left__address">{currentWithdrawalBeneficiary.data ? (currentWithdrawalBeneficiary.data as BeneficiaryBank).full_name : ''}</span>
                        </div>
                        <div className="select__right">
                            {isPending ? (
                                <span className="select__right__pending">{formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.pending' })}</span>
                            ) : null}
                            <span className="select__right__tip" onMouseOver={() => setTipState(true)} onMouseOut={() => setTipState(false)}><TipIcon/></span>
                            <span className="select__right__select">{formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.select' })}</span>
                            <span className="select__right__chevron"><ChevronIcon /></span>
                        </div>
                    </div>
                    {isOpenDropdown && renderDropdownBody(beneficiaries, type)}
                    {isOpenTip && renderDropdownTipFiat(currentWithdrawalBeneficiary)}
                </div>
            );
        }

        return (
            <div className={dropdownClassName}>
                <div className="pg-beneficiaries__dropdown__select select" onClick={() => toggleDropdown(!isOpenDropdown)}>
                    <div className="select__left">
                        <span className="select__left__title">
                            {formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.name' })}
                        </span>
                        <span className="select__left__address">
                            <span>
                                {currentWithdrawalBeneficiary.name}
                            </span>
                        </span>
                    </div>
                    <div className="select__right">
                        {isPending ? (
                            <span className="select__right__pending">
                                {formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.pending' })}
                            </span>
                        ) : null}
                        <span className="select__right__tip" onMouseOver={() => setTipState(true)} onMouseOut={() => setTipState(false)}>
                            <TipIcon/>
                        </span>
                        <span className="select__right__select">
                            {formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.select' })}
                        </span>
                        <span className="select__right__chevron"><ChevronIcon /></span>
                    </div>
                </div>
                {isOpenDropdown && renderDropdownBody(beneficiariesList, type)}
                {isOpenTip && renderDropdownTipCrypto(currentWithdrawalBeneficiary)}
            </div>
        );
    }, [isOpenDropdown, isOpenTip]);

    const renderDropdownItem = React.useCallback((item: Beneficiary, index: number, type: OwnProps['type']) => {
        const isPending = item.state && item.state.toLowerCase() === 'pending';
        const itemClassName = classnames('pg-beneficiaries__dropdown__body__item', 'item', {
            'item--pending': isPending,
        });

        if (type === 'fiat') {
            return (
                <div key={index} className={itemClassName}>
                    <div className="item__left" onClick={handleClickSelectAddress(item)}>
                        <span className="item__left__title">
                            {formatMessage({ id:'page.body.wallets.beneficiaries.dropdown.fiat.name' })}
                        </span>
                        <span className="item__left__address">
                            {item.name}
                        </span>
                    </div>
                    <div className="item__left" onClick={handleClickSelectAddress(item)}>
                        <span className="item__left__title">
                            {formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.fiat.fullName' })}
                        </span>
                        <span className="item__left__address">
                            {item.data ? (item.data as BeneficiaryBank).full_name : ''}
                        </span>
                    </div>
                    <div className="item__right">
                        {isPending && (
                            <span className="item__right__pending" onClick={handleClickSelectAddress(item)}>
                                {formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.pending' })}
                            </span>
                        )}
                        <span className="item__right__delete" onClick={handleDeleteAddress(item)}>
                            <TrashBin/>
                        </span>
                    </div>
                </div>
            );
        }

        return (
            <div key={index} className={itemClassName}>
                <div className="item__left" onClick={handleClickSelectAddress(item)}>
                    <span className="item__left__title">
                        {formatMessage({ id: 'page.body.wallets.beneficiaries.dropdown.name' })}
                    </span>
                    <span className="item__left__address">
                        {item.name}
                    </span>
                </div>
                <div className="item__right">
                    {isPending ? (
                        <span className="item__right__pending">
                            {formatMessage({ id:'page.body.wallets.beneficiaries.dropdown.pending' })}
                        </span>
                    ) : null}
                    <span className="item__right__delete" onClick={handleDeleteAddress(item)}>
                        <TrashBin/>
                    </span>
                </div>
            </div>
        );
    }, [type]);

    const renderDropdownBody = React.useCallback((beneficiariesList: Beneficiary[], type: 'fiat' | 'coin') => {
        const dropdownBodyClassName = classnames('pg-beneficiaries__dropdown__body', {
            'fiat-body': type === 'fiat',
        });

        return (
            <div className={dropdownBodyClassName}>
                {beneficiariesList && beneficiariesList.map((item, index) => renderDropdownItem(item, index, type))}
                <div className="pg-beneficiaries__dropdown__body__add add" onClick={handleClickToggleAddAddressModal()}>
                    <span className="add__label">
                        {formatMessage({ id: 'page.body.wallets.beneficiaries.addAddress' })}
                    </span>
                    <PlusIcon className="add__icon" />
                </div>
            </div>
        );
    }, []);

    const renderBeneficiariesAddModal = React.useMemo(() => {
        return (
            <BeneficiariesAddModal
                currency={currency}
                type={type}
                handleToggleAddAddressModal={() => setAddressModalState(false)}
            />
        );
    }, [currency, type]);

    const renderActivateModal = React.useMemo(() => {
        return (
            <BeneficiariesActivateModal
                beneficiariesAddData={beneficiariesAddData}
                handleToggleConfirmationModal={() => setConfirmationModalState(false)}
            />
        );
    }, []);

    const renderFailModal = React.useMemo(() => {
        return (
            <BeneficiariesFailAddModal
                isMobileDevice={isMobileDevice}
                handleToggleFailModal={() => setFailModalState(false)}
            />
        );
    }, []);

    const filtredBeneficiaries = React.useMemo(() =>
        handleFilterByState(beneficiaries, ['active', 'pending']), [beneficiaries]);

    return (
        <div className="pg-beneficiaries">
            <span className="pg-beneficiaries__title">
                {props.type === 'coin'
                    ? formatMessage({ id: 'page.body.wallets.beneficiaries.title' })
                    : formatMessage({ id: 'page.body.wallets.beneficiaries.fiat.title'})
                }
            </span>
            {filtredBeneficiaries.length ? renderAddressDropdown(filtredBeneficiaries, currentWithdrawalBeneficiary, type) : renderAddAddress}
            {isOpenAddressModal && renderBeneficiariesAddModal}
            {isOpenConfirmationModal && renderActivateModal}
            {isOpenFailModal && renderFailModal}
        </div>
    );
}

const Beneficiaries = React.memo(BeneficiariesComponent);

export {
    Beneficiaries,
};
