import React from 'react';
import PropTypes from 'prop-types';

import { Alert, TextContent, Title } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import './WizardStepReview.scss';

const WizardStepReview = (props) => {
    const releaseOptions = {
        'rhel-8': 'Red Hat Enterprise Linux (RHEL) 8.3',
        'centos-8': 'CentOS Stream 8'
    };
    const uploadOptions = {
        aws: 'Amazon Web Services'
    };
    return (
        <>
            { (Object.keys(props.uploadErrors).length > 0 ||
               Object.keys(props.subscriptionErrors).length > 0) &&
              <Alert variant="danger" className="pf-u-mb-xl" isInline title="Required information is missing" /> }
            <Title headingLevel="h2" size="xl">Create image</Title>
            <TextContent>
                <small>
                    Review the information and click Create image
                    to create the image using the following criteria.
                </small>
                <h3>Image output</h3>
                <dl>
                    <dt>
                        Release
                    </dt>
                    <dd>
                        { releaseOptions[props.release] }
                    </dd>
                    <dt>
                        Target environment
                    </dt>
                    <dd>
                        { props.upload && <>{ uploadOptions[props.upload.type] }</> }
                    </dd>
                </dl>
                { Object.entries(props.uploadErrors).length > 0 && (
                    <h3>Upload to AWS</h3>
                )}
                <dl>
                    { Object.entries(props.uploadErrors).map(([ key, error ]) => {
                        return (<React.Fragment key={ key }>
                            <dt>
                                { error.label }
                            </dt>
                            <dd>
                                <ExclamationCircleIcon className="error" /> { error.value }
                            </dd>
                        </React.Fragment>);
                    })}
                </dl>
                <h3>Registration</h3>
                <dl>
                    <dt>
                        Subscription
                    </dt>
                    { !props.subscribeNow &&
                      <dd>
                          Register the system later
                      </dd> }
                    { props.subscribeNow &&
                      <dd>
                          Register the system on first boot
                      </dd> }
                    { Object.entries(props.subscriptionErrors).map(([ key, error ]) => {
                        return (<React.Fragment key={ key }>
                            <dt>
                                { error.label }
                            </dt>
                            <dd>
                                <ExclamationCircleIcon className="error" /> { error.value }
                            </dd>
                        </React.Fragment>);
                    })}
                </dl>
            </TextContent>
        </>
    );
};

WizardStepReview.propTypes = {
    release: PropTypes.string,
    upload: PropTypes.object,
    subscription: PropTypes.object,
    subscribeNow: PropTypes.bool,
    uploadErrors: PropTypes.object,
    subscriptionErrors: PropTypes.object,
};

export default WizardStepReview;
