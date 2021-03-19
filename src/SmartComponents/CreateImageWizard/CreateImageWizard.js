import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { actions } from '../redux';

import { Wizard, TextContent } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';

import WizardStepImageOutput from '../../PresentationalComponents/CreateImageWizard/WizardStepImageOutput';
import WizardStepUploadAWS from '../../PresentationalComponents/CreateImageWizard/WizardStepUploadAWS';
import WizardStepUploadAzure from '../../PresentationalComponents/CreateImageWizard/WizardStepUploadAzure';
import WizardStepPackages from '../../PresentationalComponents/CreateImageWizard/WizardStepPackages';
import WizardStepUploadGoogle from '../../PresentationalComponents/CreateImageWizard/WizardStepUploadGoogle';
import WizardStepRegistration from '../../PresentationalComponents/CreateImageWizard/WizardStepRegistration';
import WizardStepReview from '../../PresentationalComponents/CreateImageWizard/WizardStepReview';
import ImageWizardFooter from '../../PresentationalComponents/CreateImageWizard/ImageWizardFooter';

import api from './../../api.js';
import './CreateImageWizard.scss';

class CreateImageWizard extends Component {
    constructor(props) {
        super(props);

        this.handlePackagesSearch = this.handlePackagesSearch.bind(this);
        this.handlePackagesFilter = this.handlePackagesFilter.bind(this);
        this.packageListChange = this.packageListChange.bind(this);
        this.mapPackagesToComponent = this.mapPackagesToComponent.bind(this);
        this.setRelease = this.setRelease.bind(this);
        this.setUploadOptions = this.setUploadOptions.bind(this);
        this.setSubscription = this.setSubscription.bind(this);
        this.setSubscribeNow = this.setSubscribeNow.bind(this);
        this.setPackagesSearchName = this.setPackagesSearchName.bind(this);
        this.setGoogleAccountType = this.setGoogleAccountType.bind(this);
        this.toggleUploadDestination = this.toggleUploadDestination.bind(this);
        this.onStep = this.onStep.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onClose = this.onClose.bind(this);
        this.validate = this.validate.bind(this);
        this.validateUploadAmazon = this.validateUploadAmazon.bind(this);
        this.validateSubscription = this.validateSubscription.bind(this);

        this.state = {
            arch: 'x86_64',
            imageType: 'qcow2',
            release: 'rhel-8',
            uploadAWS: {
                type: 'aws',
                options: {
                    share_with_accounts: []
                }
            },
            uploadAzure: {
                type: 'azure',
                options: {
                    tenant_id: null,
                    subscription_id: null,
                    resource_group: null,
                }
            },
            uploadGoogle: {
                type: 'gcp',
                accountType: 'googleAccount',
                options: {
                    share_with_accounts: []
                }
            },
            uploadDestinations: {
                aws: false,
                azure: false,
                google: false
            },
            subscription: {
                organization: null,
                'activation-key': null,
                'server-url': 'subscription.rhsm.redhat.com',
                'base-url': 'https://cdn.redhat.com/',
                insights: true
            },
            subscribeNow: true,
            /* errors take form of $fieldId: error */
            uploadAWSErrors: {},
            uploadAzureErrors: {},
            uploadGoogleErrors: {},
            subscriptionErrors: {},
            packagesAvailableComponents: [],
            packagesSelectedComponents: [],
            packagesFilteredComponents: [],
            packagesSelectedNames: [],
            packagesSearchName: '',
            onSaveInProgress: false,
            onSaveError: null,
        };
    }

    async componentDidMount() {
        let user = await insights.chrome.auth.getUser();
        this.setState({
            subscription: {
                organization: Number(user.identity.internal.org_id)
            }
        });
    }

    onStep(step) {
        if (step.name === 'Review') {
            this.validate();
        }
    }

    validate() {
        /* upload */
        Object.keys(this.state.uploadDestinations).forEach(provider => {
            switch (provider) {
                case 'aws':
                    this.validateUploadAmazon();
                    break;
                case 'azure':
                    this.validateUploadAzure();
                    break;
                case 'google':
                    break;
                default:
                    break;
            }
        });

        /* subscription */
        if (this.state.subscribeNow) {
            this.validateSubscription();
        } else {
            this.setState({ subscriptionErrors: {}});
        }
    }

    validateUploadAmazon() {
        let uploadAWSErrors = {};
        let share = this.state.uploadAWS.options.share_with_accounts;
        if (share.length === 0 || share[0].length !== 12 || isNaN(share[0])) {
            uploadAWSErrors['aws-account-id'] =
                { label: 'AWS account ID', value: 'A 12-digit number is required' };
        }

        this.setState({ uploadAWSErrors });
    }

    validateUploadAzure() {
        let uploadAzureErrors = {};

        let tenant_id = this.state.uploadAzure.options.tenant_id;
        if (tenant_id === null || tenant_id === '') {
            uploadAzureErrors['azure-resource-group'] =
                { label: 'Azure tenant ID', value: 'A tenant ID is required' };
        }

        let subscriptionId = this.state.uploadAzure.options.subscription_id;
        if (subscriptionId === null || subscriptionId === '') {
            uploadAzureErrors['azure-subscription-id'] =
                { label: 'Azure subscription ID', value: 'A subscription ID is required' };
        }

        let resource_group = this.state.uploadAzure.options.resource_group;
        if (resource_group === null || resource_group === '') {
            uploadAzureErrors['azure-resource-group'] =
                { label: 'Azure resource group', value: 'A resource group is required' };
        }
        // TODO check oauth2 thing too here?
    }

    validateSubscription() {
        let subscriptionErrors = {};
        if (!this.state.subscription['activation-key']) {
            subscriptionErrors['subscription-activation'] =
                { label: 'Activation key', value: 'A value is required' };
        }

        this.setState({ subscriptionErrors });
    }

    setRelease(release) {
        this.setState({ release });
    }

    toggleUploadDestination(provider) {
        this.setState(prevState => ({
            ...prevState,
            uploadDestinations: {
                ...prevState.uploadDestinations,
                [provider]: !prevState.uploadDestinations[provider]
            }
        }));
    }

    setUploadOptions(provider, uploadOptions) {
        switch (provider) {
            case 'aws':
                this.setState({
                    uploadAWS: {
                        type: provider,
                        options: uploadOptions
                    }
                });
                break;
            case 'azure':
                this.setState({
                    uploadAzure: {
                        type: provider,
                        options: uploadOptions
                    }
                });
                break;
            case 'google':
                this.setState({
                    uploadGoogle: {
                        ...this.state.uploadGoogle,
                        options: uploadOptions
                    }
                });
                break;
            default:
                break;
        }
    }

    setGoogleAccountType(_, event) {
        this.setState({
            uploadGoogle: {
                ...this.state.uploadGoogle,
                accountType: event.target.value
            }
        });
    }

    setSubscribeNow(subscribeNow) {
        this.setState({ subscribeNow });
    }

    setSubscription(subscription) {
        this.setState({ subscription }, this.validate);
    }

    setPackagesSearchName(packagesSearchName) {
        this.setState({ packagesSearchName });
    }

    mapPackagesToComponent(packages) {
        return packages.map((pack) =>
            <TextContent key={ pack }>
                <span className="pf-c-dual-list-selector__item-text">{ pack.name }</span>
                <small>{ pack.summary }</small>
            </TextContent>
        );
    }

    // this digs into the component properties to extract the package name
    mapComponentToPackageName(component) {
        return component.props.children[0].props.children;
    }

    handlePackagesSearch() {
        api.getPackages(this.state.release, this.state.arch, this.state.packagesSearchName).then(response => {
            const packageComponents = this.mapPackagesToComponent(response.data);
            this.setState({
                packagesAvailableComponents: packageComponents
            });
        });
    };

    handlePackagesFilter(filter) {
        const filteredPackages = this.state.packagesSelectedComponents.filter(component => {
            const name = this.mapComponentToPackageName(component);
            return name.includes(filter);
        });
        this.setState({
            packagesFilteredComponents: filteredPackages
        });
    }

    packageListChange(newAvailablePackages, newChosenPackages) {
        const chosenNames = newChosenPackages.map(component => this.mapComponentToPackageName(component));
        this.setState({
            packagesAvailableComponents: newAvailablePackages,
            packagesSelectedComponents: newChosenPackages,
            packagesFilteredComponents: newChosenPackages,
            packagesSelectedNames: chosenNames
        });
    }

    onSave() {
        this.setState({
            onSaveInProgress: true,
        });

        let requests = [];
        if (this.state.uploadDestinations.aws) {
            let request = {
                distribution: this.state.release,
                image_requests: [
                    {
                        architecture: this.state.arch,
                        image_type: 'ami',
                        upload_requests: [ this.state.uploadAWS ],
                    }],
                customizations: {
                    subscription: this.state.subscription,
                    packages: this.state.packagesSelectedNames,
                },
            };
            requests.push(request);
        }

        if (this.state.uploadDestinations.google) {
            let share = '';
            switch (this.state.uploadGoogle.accountType) {
                case 'googleAccount':
                    share = 'user:' + this.state.uploadGoogle.options.share_with_accounts[0].user;
                    break;
                case 'serviceAccount':
                    share = 'serviceAccount:' + this.state.uploadGoogle.options.share_with_accounts[0].serviceAccount;
                    break;
                case 'googleGroup':
                    share = 'group:' + this.state.uploadGoogle.options.share_with_accounts[0].group;
                    break;
                case 'domain':
                    share = 'domain:' + this.state.uploadGoogle.options.share_with_accounts[0].domain;
                    break;
            }

            let request = {
                distribution: this.state.release,
                image_requests: [
                    {
                        architecture: this.state.arch,
                        image_type: 'vhd',
                        upload_requests: [{
                            type: 'gcp',
                            options: {
                                share_with_accounts: [ share ],
                            },
                        }],
                    }],
                customizations: {
                    subscription: this.state.subscription,
                },
            };
            requests.push(request);
        }

        if (this.state.uploadDestinations.azure) {
            let request = {
                distribution: this.state.release,
                image_requests: [
                    {
                        architecture: this.state.arch,
                        image_type: 'vhd',
                        upload_requests: [{
                            type: 'azure',
                            options: {
                                tenant_id: this.state.uploadAzure.options.tenant_id,
                                subscription_id: this.state.uploadAzure.options.subscription_id,
                                resource_group: this.state.uploadAzure.options.resource_group,
                            },
                        }],
                    }],
                customizations: {
                    subscription: this.state.subscription,
                },
            };
            requests.push(request);

        }

        const composeRequests = [];
        requests.forEach(request => {
            const composeRequest = api.composeImage(request).then(response => {
                let compose = {};
                compose[response.id] = {
                    image_status: {
                        status: 'pending',
                    },
                    distribution: request.distribution,
                    architecture: request.image_requests[0].architecture,
                    image_type: request.image_requests[0].image_type,
                    upload_type: request.image_requests[0].upload_requests[0].type,
                };
                this.props.updateCompose(compose);
            });
            composeRequests.push(composeRequest);
        });

        Promise.all(composeRequests)
            .then(() => {
                this.props.addNotification({
                    variant: 'success',
                    title: 'Your image is being created',
                });
                this.props.history.push('/landing');
            })
            .catch(err => {
                this.setState({ onSaveInProgress: false });
                if (err.response.status === 500) {
                    this.setState({ onSaveError: 'Error: Something went wrong serverside' });
                }
            });
    }

    onClose () {
        this.props.history.push('/landing');
    }

    render() {
        const StepImageOutput = {
            name: 'Image output',
            component: <WizardStepImageOutput
                value={ this.state.release }
                setRelease={ this.setRelease }
                toggleUploadDestination={ this.toggleUploadDestination }
                uploadDestinations={ this.state.uploadDestinations } />
        };

        const StepUploadAWS = {
            name: 'Amazon Web Services',
            component: <WizardStepUploadAWS
                uploadAWS={ this.state.uploadAWS }
                setUploadOptions={ this.setUploadOptions }
                errors={ this.state.uploadAWSErrors } />
        };

        const StepUploadAzure = {
            name: 'Microsoft Azure',
            component: <WizardStepUploadAzure
                uploadAzure={ this.state.uploadAzure }
                setUploadOptions={ this.setUploadOptions }
                errors={ this.state.uploadAzureErrors } />
        };

        const StepUploadGoogle = {
            name: 'Google Cloud Platform',
            component: <WizardStepUploadGoogle
                uploadGoogle={ this.state.uploadGoogle }
                setGoogleAccountType={ this.setGoogleAccountType }
                setUploadOptions={ this.setUploadOptions }
                errors={ this.state.uploadGoogleErrors } />
        };

        const uploadDestinationSteps = [];
        if (this.state.uploadDestinations.aws) {
            uploadDestinationSteps.push(StepUploadAWS);
        }

        if (this.state.uploadDestinations.azure) {
            uploadDestinationSteps.push(StepUploadAzure);
        }

        if (this.state.uploadDestinations.google) {
            uploadDestinationSteps.push(StepUploadGoogle);
        }

        const StepTargetEnv = {
            name: 'Target environment',
            steps: uploadDestinationSteps
        };

        const steps = [
            StepImageOutput,
            ...(StepTargetEnv.steps.length > 0 ? [ StepTargetEnv ] : []),
            {
                name: 'Registration',
                component: <WizardStepRegistration
                    subscription={ this.state.subscription }
                    subscribeNow={ this.state.subscribeNow }
                    setSubscription={ this.setSubscription }
                    setSubscribeNow={ this.setSubscribeNow }
                    errors={ this.state.subscriptionErrors } /> },
            {
                name: 'Packages',
                component: <WizardStepPackages
                    packageListChange={ this.packageListChange }
                    release={ this.state.release }
                    packagesAvailableComponents={ this.state.packagesAvailableComponents }
                    packagesFilteredComponents={ this.state.packagesFilteredComponents }
                    handlePackagesSearch={ this.handlePackagesSearch }
                    handlePackagesFilter= { this.handlePackagesFilter }
                    setPackagesSearchName={ this.setPackagesSearchName } /> },
            {
                name: 'Review',
                component: <WizardStepReview
                    release={ this.state.release }
                    uploadAWS={ this.state.uploadAWS }
                    uploadGoogle={ this.state.uploadGoogle }
                    uploadDestinations={ this.state.uploadDestinations }
                    subscription={ this.state.subscription }
                    subscribeNow={ this.state.subscribeNow }
                    uploadAWSErrors={ this.state.uploadAWSErrors }
                    subscriptionErrors={ this.state.subscriptionErrors } />,
                nextButtonText: 'Create',
            }
        ];
        return (
            <React.Fragment>
                <Wizard
                    title={ 'Create image' }
                    onNext={ this.onStep }
                    onGoToStep={ this.onStep }
                    steps={ steps }
                    onClose={ this.onClose }
                    onSave={ this.onSave }
                    footer={ <ImageWizardFooter disable={ this.state.onSaveInProgress } error={ this.state.onSaveError } /> }
                    isOpen />
            </React.Fragment>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return {
        updateCompose: (compose) => dispatch(actions.updateCompose(compose)),
        addNotification: (not) => dispatch(addNotification(not)),
    };
}

CreateImageWizard.propTypes = {
    updateCompose: PropTypes.func,
    addNotification: PropTypes.func,
    history: PropTypes.object,
};

export default connect(null, mapDispatchToProps)(withRouter(CreateImageWizard));
