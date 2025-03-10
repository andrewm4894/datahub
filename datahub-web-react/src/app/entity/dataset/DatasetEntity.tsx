import * as React from 'react';
import { DatabaseFilled, DatabaseOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { Dataset, EntityType, RelationshipDirection, SearchResult } from '../../../types.generated';
import { Entity, IconStyleType, PreviewType } from '../Entity';
import { Preview } from './preview/Preview';
import { FIELDS_TO_HIGHLIGHT } from './search/highlights';
import { getChildrenFromRelationships } from '../../lineage/utils/getChildren';
import { EntityProfile } from '../shared/containers/profile/EntityProfile';
import { GetDatasetQuery, useGetDatasetQuery, useUpdateDatasetMutation } from '../../../graphql/dataset.generated';
import { GenericEntityProperties } from '../shared/types';
import { PropertiesTab } from '../shared/tabs/Properties/PropertiesTab';
import { DocumentationTab } from '../shared/tabs/Documentation/DocumentationTab';
import { SchemaTab } from '../shared/tabs/Dataset/Schema/SchemaTab';
import QueriesTab from '../shared/tabs/Dataset/Queries/QueriesTab';
import { SidebarAboutSection } from '../shared/containers/profile/sidebar/SidebarAboutSection';
import { SidebarOwnerSection } from '../shared/containers/profile/sidebar/Ownership/SidebarOwnerSection';
import { SidebarTagsSection } from '../shared/containers/profile/sidebar/SidebarTagsSection';
import { SidebarStatsSection } from '../shared/containers/profile/sidebar/Dataset/StatsSidebarSection';
import StatsTab from '../shared/tabs/Dataset/Stats/StatsTab';
import { LineageTab } from '../shared/tabs/Lineage/LineageTab';
import { capitalizeFirstLetter } from '../../shared/capitalizeFirstLetter';
import ViewDefinitionTab from '../shared/tabs/Dataset/View/ViewDefinitionTab';
import { SidebarViewDefinitionSection } from '../shared/containers/profile/sidebar/Dataset/View/SidebarViewDefinitionSection';
import { SidebarRecommendationsSection } from '../shared/containers/profile/sidebar/Recommendations/SidebarRecommendationsSection';
import { getDataForEntityType } from '../shared/containers/profile/utils';

const SUBTYPES = {
    VIEW: 'view',
};

/**
 * Definition of the DataHub Dataset entity.
 */
export class DatasetEntity implements Entity<Dataset> {
    type: EntityType = EntityType.Dataset;

    icon = (fontSize: number, styleType: IconStyleType) => {
        if (styleType === IconStyleType.TAB_VIEW) {
            return <DatabaseOutlined style={{ fontSize }} />;
        }

        if (styleType === IconStyleType.HIGHLIGHT) {
            return <DatabaseFilled style={{ fontSize, color: '#B37FEB' }} />;
        }

        if (styleType === IconStyleType.SVG) {
            return (
                <path d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-600 72h560v208H232V136zm560 480H232V408h560v208zm0 272H232V680h560v208zM304 240a40 40 0 1080 0 40 40 0 10-80 0zm0 272a40 40 0 1080 0 40 40 0 10-80 0zm0 272a40 40 0 1080 0 40 40 0 10-80 0z" />
            );
        }

        return (
            <DatabaseFilled
                style={{
                    fontSize,
                    color: '#BFBFBF',
                }}
            />
        );
    };

    isSearchEnabled = () => true;

    isBrowseEnabled = () => true;

    isLineageEnabled = () => true;

    getAutoCompleteFieldName = () => 'name';

    getPathName = () => 'dataset';

    getEntityName = () => 'Dataset';

    getCollectionName = () => 'Datasets';

    renderProfile = (urn: string) => (
        <EntityProfile
            urn={urn}
            entityType={EntityType.Dataset}
            useEntityQuery={useGetDatasetQuery}
            useUpdateQuery={useUpdateDatasetMutation}
            getOverrideProperties={this.getOverridePropertiesFromEntity}
            tabs={[
                {
                    name: 'Schema',
                    component: SchemaTab,
                },
                {
                    name: 'View Definition',
                    component: ViewDefinitionTab,
                    display: {
                        visible: (_, dataset: GetDatasetQuery) =>
                            (dataset?.dataset?.subTypes?.typeNames?.includes(SUBTYPES.VIEW) && true) || false,
                        enabled: (_, dataset: GetDatasetQuery) =>
                            (dataset?.dataset?.viewProperties?.logic && true) || false,
                    },
                },
                {
                    name: 'Documentation',
                    component: DocumentationTab,
                },
                {
                    name: 'Properties',
                    component: PropertiesTab,
                },
                {
                    name: 'Lineage',
                    component: LineageTab,
                    display: {
                        visible: (_, _1) => true,
                        enabled: (_, dataset: GetDatasetQuery) =>
                            (dataset?.dataset?.incoming?.count || 0) > 0 ||
                            (dataset?.dataset?.outgoing?.count || 0) > 0,
                    },
                },
                {
                    name: 'Queries',
                    component: QueriesTab,
                    display: {
                        visible: (_, _1) => true,
                        enabled: (_, dataset: GetDatasetQuery) =>
                            (dataset?.dataset?.usageStats?.buckets?.length || 0) > 0,
                    },
                },
                {
                    name: 'Stats',
                    component: StatsTab,
                    display: {
                        visible: (_, _1) => true,
                        enabled: (_, dataset: GetDatasetQuery) =>
                            (dataset?.dataset?.datasetProfiles?.length || 0) > 0 ||
                            (dataset?.dataset?.usageStats?.buckets?.length || 0) > 0,
                    },
                },
            ]}
            sidebarSections={[
                {
                    component: SidebarAboutSection,
                },
                {
                    component: SidebarViewDefinitionSection,
                    display: {
                        visible: (_, dataset: GetDatasetQuery) =>
                            (dataset?.dataset?.viewProperties?.logic && true) || false,
                    },
                },
                {
                    component: SidebarStatsSection,
                    display: {
                        visible: (_, dataset: GetDatasetQuery) =>
                            (dataset?.dataset?.datasetProfiles?.length || 0) > 0 ||
                            (dataset?.dataset?.usageStats?.buckets?.length || 0) > 0,
                    },
                },
                {
                    component: SidebarTagsSection,
                    properties: {
                        hasTags: true,
                        hasTerms: true,
                    },
                },
                {
                    component: SidebarOwnerSection,
                },
                {
                    component: SidebarRecommendationsSection,
                },
            ]}
        />
    );

    getOverridePropertiesFromEntity = (dataset?: Dataset | null): GenericEntityProperties => {
        // if dataset has subTypes filled out, pick the most specific subtype and return it
        const subTypes = dataset?.subTypes;
        return {
            externalUrl: dataset?.properties?.externalUrl,
            entityTypeOverride: subTypes ? capitalizeFirstLetter(subTypes.typeNames?.[0]) : '',
        };
    };

    renderPreview = (_: PreviewType, data: Dataset) => {
        return (
            <Preview
                urn={data.urn}
                name={data.name}
                origin={data.origin}
                subtype={data.subTypes?.typeNames?.[0]}
                description={data.editableProperties?.description || data.description}
                platformName={data.platform.displayName || data.platform.name}
                platformLogo={data.platform.info?.logoUrl}
                owners={data.ownership?.owners}
                globalTags={data.globalTags}
                glossaryTerms={data.glossaryTerms}
            />
        );
    };

    renderSearch = (result: SearchResult) => {
        const data = result.entity as Dataset;
        return (
            <Preview
                urn={data.urn}
                name={data.name}
                origin={data.origin}
                description={data.editableProperties?.description || data.description}
                platformName={data.platform.name}
                platformLogo={data.platform.info?.logoUrl}
                owners={data.ownership?.owners}
                globalTags={data.globalTags}
                glossaryTerms={data.glossaryTerms}
                subtype={data.subTypes?.typeNames?.[0]}
                snippet={
                    // Add match highlights only if all the matched fields are in the FIELDS_TO_HIGHLIGHT
                    result.matchedFields.length > 0 &&
                    result.matchedFields.every((field) => FIELDS_TO_HIGHLIGHT.has(field.name)) && (
                        <Typography.Text>
                            Matches {FIELDS_TO_HIGHLIGHT.get(result.matchedFields[0].name)}{' '}
                            <b>{result.matchedFields[0].value}</b>
                        </Typography.Text>
                    )
                }
                insights={result.insights}
            />
        );
    };

    getLineageVizConfig = (entity: Dataset) => {
        return {
            urn: entity?.urn,
            name: entity?.name,
            type: EntityType.Dataset,
            subtype: entity.subTypes?.typeNames?.[0] || undefined,
            downstreamChildren: getChildrenFromRelationships({
                // eslint-disable-next-line @typescript-eslint/dot-notation
                incomingRelationships: entity?.['incoming'],
                // eslint-disable-next-line @typescript-eslint/dot-notation
                outgoingRelationships: entity?.['outgoing'],
                direction: RelationshipDirection.Incoming,
            }),
            upstreamChildren: getChildrenFromRelationships({
                // eslint-disable-next-line @typescript-eslint/dot-notation
                incomingRelationships: entity?.['incoming'],
                // eslint-disable-next-line @typescript-eslint/dot-notation
                outgoingRelationships: entity?.['outgoing'],
                direction: RelationshipDirection.Outgoing,
            }),
            icon: entity?.platform?.info?.logoUrl || undefined,
            platform: entity?.platform?.name,
        };
    };

    displayName = (data: Dataset) => {
        return data?.name;
    };

    platformLogoUrl = (data: Dataset) => {
        return data.platform.info?.logoUrl || undefined;
    };

    getGenericEntityProperties = (data: Dataset) => {
        return getDataForEntityType({
            data,
            entityType: this.type,
            getOverrideProperties: this.getOverridePropertiesFromEntity,
        });
    };
}
